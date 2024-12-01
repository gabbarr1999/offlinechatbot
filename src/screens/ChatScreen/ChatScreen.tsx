import React, { useRef, ReactNode, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { observer } from 'mobx-react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { Bubble, ChatView } from '../../components';

import { useChatSession } from '../../hooks';

import { ModelNotLoadedMessage } from './ModelNotLoadedMessage';

import { modelStore, chatSessionStore } from '../../store';

import { L10nContext } from '../../utils';
import { MessageType } from '../../utils/types';
import { user, assistant } from '../../utils/chat';

interface ChatProps {
  customBottomComponent?: () => React.ReactElement;
  renderBubble: (props: {
    child: ReactNode;
    message: MessageType.Any;
    nextMessageInGroup: boolean;
  }) => React.ReactElement;
  messages: MessageType.Any[];
  onSendPress: () => void;
  onStopPress: () => void;
  user: any;
  isStopVisible: boolean;
  isThinking: boolean;
  isStreaming: boolean;
  sendButtonVisibilityMode: string;
  textInputProps: any;
  renderInput?: (props: any) => React.ReactElement;
}

interface ModelStore {
  context: any;
  isContextLoading: boolean;
  downloadModel: () => Promise<void>;
}

interface ChatSessionStore {
  currentSessionMessages: MessageType.Any[];
  deleteAllSessions: () => void;
}

const modelStoreTyped = modelStore as unknown as ModelStore;
const chatSessionStoreTyped = chatSessionStore as unknown as ChatSessionStore;

const renderBubble = ({
  child,
  message,
  nextMessageInGroup,
}: {
  child: ReactNode;
  message: MessageType.Any;
  nextMessageInGroup: boolean;
}) => (
  <Bubble
    child={child}
    message={message}
    nextMessageInGroup={nextMessageInGroup}
  />
);

export const ChatScreen: React.FC = observer(() => {
  const context = modelStoreTyped.context;
  const currentMessageInfo = useRef<{ createdAt: number; id: string } | null>(
    null,
  );
  const l10n = React.useContext(L10nContext);
  const messages = chatSessionStoreTyped.currentSessionMessages;

  const { handleSendPress, handleStopPress, inferencing, isStreaming } =
    useChatSession(context, currentMessageInfo, messages, user, assistant);

  const isThinking = inferencing && !isStreaming;

  const [showModelDownload, setShowModelDownload] = useState(false);

  // useEffect(() => {
  //   setShowModelDownload(true);
  // }, []);

  const handleModelDownload = async () => {
    try {
      await modelStoreTyped.downloadModel();
      setShowModelDownload(false);
    } catch (error) {
      console.error('Failed to download model:', error);
    }
  };

  const ModelDownloadPopup = () => {
    if (!showModelDownload) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{l10n.downloadModelTitle}</Text>
          <Text style={styles.modalText}>{l10n.downloadModelDescription}</Text>
          <Text style={styles.modalSubtext}>{l10n.downloadModelTimeEstimate}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => setShowModelDownload(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>{l10n.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleModelDownload}
              style={styles.downloadButton}
            >
              <Text style={styles.downloadButtonText}>{l10n.download}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <ChatView
          customBottomComponent={
            context || modelStoreTyped.isContextLoading ? undefined : () => <ModelNotLoadedMessage />
          }
          renderBubble={renderBubble}
          messages={messages}
          onSendPress={handleSendPress}
          onStopPress={handleStopPress}
          user={user}
          isStopVisible={inferencing}
          isThinking={isThinking}
          isStreaming={isStreaming}
          sendButtonVisibilityMode="editing"
          textInputProps={{
            editable: !!context,
            placeholder: !context
              ? modelStoreTyped.isContextLoading
                ? l10n.loadingModel
                : l10n.modelNotLoaded
              : l10n.typeYourMessage,
          }}
        />
      </View>
      <ModelDownloadPopup />
    </SafeAreaProvider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#000000',
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  cancelButton: {
    padding: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
