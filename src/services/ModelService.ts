import RNFS from 'react-native-fs';
import {modelStore} from '../store';
import {Model, ModelOrigin} from '../utils/types';
import {runInAction} from 'mobx';
import NetInfo from '@react-native-community/netinfo';

const MODEL_FILENAME = 'Llama-3.2-1B-Instruct-Q4_K_M.gguf';
const MODEL_URL = 'https://flash-app-bucket.s3.us-east-1.amazonaws.com/offline_model/Llama-3.2-1B-Instruct-Q4_K_M.gguf';
const RETRY_DELAY = 5000;
const MAX_RETRIES = 3;

class ModelService {
  private modelPath: string;
  private defaultModel: Model;
  private retryCount: number = 0;
  private lastProgress: number = 0;
  private lastProgressUpdate: number = 0;
  private downloadStartTime: number = 0;

  constructor() {
    this.modelPath = `${RNFS.DocumentDirectoryPath}/${MODEL_FILENAME}`;

    this.defaultModel = {
      id: MODEL_FILENAME,
      author: 'default',
      name: 'Default Llama Model',
      type: 'Llama',
      size: 0,
      params: 0,
      isDownloaded: true,
      downloadUrl: MODEL_URL,
      hfUrl: '',
      progress: 100,
      filename: MODEL_FILENAME,
      isLocal: true,
      origin: ModelOrigin.LOCAL,
      fullPath: this.modelPath,
      defaultChatTemplate: modelStore.models[0]?.defaultChatTemplate || {},
      chatTemplate: modelStore.models[0]?.chatTemplate || {},
      defaultCompletionSettings: modelStore.models[0]?.defaultCompletionSettings || {},
      completionSettings: modelStore.models[0]?.completionSettings || {},
    };
  }

  async checkIfModelExists(): Promise<boolean> {
    try {
      const exists = await RNFS.exists(this.modelPath);
      if (exists) {
        await RNFS.stat(this.modelPath);
      }
      return exists;
    } catch (error) {
      return false;
    }
  }

  private calculateDownloadStats(bytesWritten: number, contentLength: number): {
    progress: number;
    speed: string;
    eta: string;
  } {
    const now = Date.now();
    const progress = bytesWritten / contentLength;
    
    // Calculate speed
    const timeDiff = (now - this.lastProgressUpdate) / 1000; // seconds
    const bytesDiff = bytesWritten - this.lastProgress;
    const speedBps = bytesDiff / timeDiff;
    const speedMBps = (speedBps / (1024 * 1024)).toFixed(2);
    
    // Calculate ETA
    const remainingBytes = contentLength - bytesWritten;
    const etaSeconds = speedBps > 0 ? remainingBytes / speedBps : 0;
    const etaMinutes = Math.ceil(etaSeconds / 60);
    const etaText = etaSeconds >= 60 ? `${etaMinutes} min` : `${Math.ceil(etaSeconds)} sec`;
    
    this.lastProgress = bytesWritten;
    this.lastProgressUpdate = now;
    
    return {
      progress,
      speed: `${speedMBps} MB/s`,
      eta: etaText
    };
  }

  private async checkNetworkConnection(): Promise<{isConnected: boolean; details: string}> {
    try {
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected) {
        return {isConnected: false, details: 'No network connection'};
      }
      
      if (netInfo.isConnected && !netInfo.isInternetReachable) {
        return {isConnected: false, details: 'Internet is not reachable'};
      }

      try {
        const response = await fetch(MODEL_URL, {method: 'HEAD'});
        if (!response.ok) {
          return {isConnected: false, details: `Cannot reach model server (${response.status})`};
        }
      } catch (error) {
        return {isConnected: false, details: 'Cannot reach model server'};
      }

      return {isConnected: true, details: 'Connected'};
    } catch (error) {
      return {isConnected: false, details: 'Error checking network connection'};
    }
  }

  async downloadModel(onProgress: (progress: number) => void): Promise<string> {
    try {
      const networkStatus = await this.checkNetworkConnection();
      if (!networkStatus.isConnected) {
        throw new Error(networkStatus.details);
      }

      await RNFS.getFSInfo();

      this.downloadStartTime = Date.now();
      this.lastProgressUpdate = Date.now();
      this.lastProgress = 0;

      const downloadJob = RNFS.downloadFile({
        fromUrl: MODEL_URL,
        toFile: this.modelPath,
        progress: (res) => {
          const stats = this.calculateDownloadStats(res.bytesWritten, res.contentLength);
          onProgress(stats.progress);
        },
        begin: (res) => {
          // Silent begin
        },
        background: true,
        discretionary: true,
        cacheable: true,
      });

      const response = await downloadJob.promise;

      if (response.statusCode === 200) {
        const stats = await RNFS.stat(this.modelPath);
        
        if (stats.size === 0) {
          throw new Error('Downloaded file is empty');
        }
        
        runInAction(() => {
          this.defaultModel.size = stats.size;
        });
        
        return this.modelPath;
      } else {
        throw new Error(`Download failed with status ${response.statusCode}`);
      }
    } catch (error) {
      // Clean up failed download
      try {
        if (await RNFS.exists(this.modelPath)) {
          await RNFS.unlink(this.modelPath);
        }
      } catch (cleanupError) {
        // Silent cleanup error
      }

      // Handle retries for network errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (this.retryCount < MAX_RETRIES && 
          (errorMessage.includes('network') || 
           errorMessage.includes('internet') || 
           errorMessage.includes('connection') ||
           errorMessage.includes('reach'))) {
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.downloadModel(onProgress);
      }
      
      this.retryCount = 0;
      throw error;
    }
  }

  async initializeModel(): Promise<void> {
    try {
      // Add delay after download to let memory settle
      await new Promise(resolve => setTimeout(resolve, 2000));

      const exists = await this.checkIfModelExists();
      if (!exists) {
        return;
      }

      const stats = await RNFS.stat(this.modelPath);
      if (stats.size === 0) {
        return;
      }

      // Add model to modelStore's list if not already present
      const existingModel = modelStore.models.find(m => m.id === this.defaultModel.id);
      if (!existingModel) {
        runInAction(() => {
          modelStore.models.push({...this.defaultModel});
        });
      }

      // Start with minimal settings for first initialization
      runInAction(() => {
        if (modelStore.activeModel?.completionSettings) {
          modelStore.activeModel.completionSettings.n_predict = 128;  // Start small
          modelStore.activeModel.completionSettings.temperature = 0.7;
          modelStore.activeModel.completionSettings.top_k = 20;
          modelStore.activeModel.completionSettings.top_p = 0.9;
        }
      });

      // Try initialization with delay between attempts
      let initialized = false;
      let attempts = 0;
      const MAX_ATTEMPTS = 3;

      while (!initialized && attempts < MAX_ATTEMPTS) {
        try {
          await modelStore.initContext(this.defaultModel);
          initialized = true;
        } catch (initError) {
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            throw initError;
          }
          // Longer delay between attempts
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      if (!initialized) {
        return;
      }
    } catch (error) {
      // Silent error handling
    }
  }

  getModelPath(): string {
    return this.modelPath;
  }
}

export const modelService = new ModelService(); 