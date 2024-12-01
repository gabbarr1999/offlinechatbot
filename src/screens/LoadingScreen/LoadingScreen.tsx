import React, {useState, useEffect} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {Text} from 'react-native-paper';
import * as Progress from 'react-native-progress';
import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {modelService} from '../../services/ModelService';
import {modelStore} from '../../store';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({onLoadComplete}) => {
  const [status, setStatus] = useState<string>('Checking model...');
  const [progress, setProgress] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const theme = useTheme();
  const styles = createStyles(theme);

  useEffect(() => {
    async function prepareModel() {
      try {
        console.log('[LoadingScreen] Starting model preparation');
        
        // First check if model is already initialized in modelStore
        if (modelStore.context && modelStore.activeModelId) {
          console.log('[LoadingScreen] Model already initialized in store');
          onLoadComplete();
          return;
        }

        // Check if model exists on device
        const exists = await modelService.checkIfModelExists();
        console.log('[LoadingScreen] Model exists:', exists);
        
        if (exists) {
          setStatus('Initializing model...');
          setProgress(1);
          await modelService.initializeModel();
          console.log('[LoadingScreen] Model initialized successfully');
          onLoadComplete();
        } else {
          setStatus('Downloading model...');
          await modelService.downloadModel((downloadProgress) => {
            setProgress(downloadProgress);
            setStatus(`Downloading model... ${Math.round(downloadProgress * 100)}%`);
            console.log('[LoadingScreen] Download progress:', downloadProgress);
          });
          
          setStatus('Initializing model...');
          await modelService.initializeModel();
          console.log('[LoadingScreen] Model downloaded and initialized successfully');
          onLoadComplete();
        }
      } catch (error) {
        console.error('[LoadingScreen] Error:', error);
        
        if (retryCount < MAX_RETRIES) {
          console.log(`[LoadingScreen] Retrying (${retryCount + 1}/${MAX_RETRIES})`);
          setStatus('Retrying...');
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            prepareModel();
          }, 5000);
        } else {
          setStatus('Please restart the app');
        }
      }
    }

    prepareModel();
  }, [onLoadComplete, retryCount]);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.statusText}>{status}</Text>
        <Progress.Bar
          progress={progress}
          width={200}
          color={theme.colors.primary}
          borderColor={theme.colors.primary}
          style={styles.progressBar}
        />
      </View>
    </View>
  );
}; 