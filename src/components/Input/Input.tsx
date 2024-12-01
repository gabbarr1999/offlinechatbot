import * as React from 'react';
import {TextInput, TextInputProps, View, ActionSheetIOS, Platform, Image, TouchableOpacity} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Voice from '@react-native-voice/voice';

import {useTheme} from '../../hooks';

import {styles} from './styles';

import {MessageType} from '../../utils/types';
import {L10nContext, unwrap, UserContext} from '../../utils';

import {
  AttachmentButton,
  AttachmentButtonAdditionalProps,
  CircularActivityIndicator,
  CircularActivityIndicatorProps,
  SendButton,
  StopButton,
} from '..';

export interface InputTopLevelProps {
  isAttachmentUploading?: boolean;
  isStreaming?: boolean;
  onAttachmentPress?: () => void;
  onSendPress: (message: MessageType.PartialText) => void;
  onStopPress?: () => void;
  isStopVisible?: boolean;
  sendButtonVisibilityMode?: 'always' | 'editing';
  textInputProps?: TextInputProps;
}

export interface InputAdditionalProps {
  attachmentButtonProps?: AttachmentButtonAdditionalProps;
  attachmentCircularActivityIndicatorProps?: CircularActivityIndicatorProps;
}

export type InputProps = InputTopLevelProps & InputAdditionalProps;

export const Input = ({
  attachmentButtonProps,
  attachmentCircularActivityIndicatorProps,
  isAttachmentUploading,
  isStreaming = false,
  onAttachmentPress,
  onSendPress,
  onStopPress,
  isStopVisible,
  sendButtonVisibilityMode,
  textInputProps,
}: InputProps) => {
  const l10n = React.useContext(L10nContext);
  const theme = useTheme();
  const user = React.useContext(UserContext);
  const {container, input, marginRight, micButton} = styles({theme});

  const [text, setText] = React.useState(textInputProps?.defaultValue ?? '');
  const [isRecording, setIsRecording] = React.useState(false);
  const value = textInputProps?.value ?? text;
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = (e: any) => {
    if (e.value && e.value[0]) {
      setText((prevText) => prevText + ' ' + e.value[0]);
    }
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
  };

  const startVoiceRecording = async () => {
    try {
      await Voice.start('en-US');
      setIsRecording(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageSelection = async (type: 'camera' | 'gallery') => {
    try {
      const options = {
        mediaType: 'photo' as const,
        includeBase64: true,
      };
      
      const response = type === 'camera' 
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (response.assets && response.assets[0]?.base64) {
        const imageData = response.assets[0];
        setSelectedImage(`data:image/jpeg;base64,${imageData.base64}`);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const handleAttachmentPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            handleImageSelection('camera');
          } else if (buttonIndex === 2) {
            handleImageSelection('gallery');
          }
        },
      );
    } else {
      handleImageSelection('gallery');
    }
  };

  const handleChangeText = (newText: string) => {
    setText(newText);
    textInputProps?.onChangeText?.(newText);
  };

  const handleSend = () => {
    const trimmedValue = value.trim();
    if (trimmedValue || selectedImage) {
      onSendPress({
        type: 'text',
        text: trimmedValue || ' ',
        images: selectedImage ? [selectedImage] : undefined
      });
      setText('');
      setSelectedImage(null);
    }
  };

  const isSendButtonVisible =
    !isStreaming &&
    !isStopVisible &&
    user &&
    (sendButtonVisibilityMode === 'always' || value.trim() || selectedImage);

  return (
    <View style={container}>
      {user && (
        <>
          {isAttachmentUploading ? (
            <CircularActivityIndicator
              {...attachmentCircularActivityIndicatorProps}
              color={theme.colors.onSurface}
            />
          ) : (
            <AttachmentButton
              {...attachmentButtonProps}
              onPress={handleAttachmentPress}
            />
          )}
        </>
      )}

      <TextInput
        accessibilityLabel={l10n.inputPlaceholder}
        multiline
        placeholder={l10n.inputPlaceholder}
        placeholderTextColor={theme.colors.outline}
        style={[input, { color: theme.colors.onSurface }]}
        value={value}
        onChangeText={handleChangeText}
        {...textInputProps}
      />

      {user && (
        <TouchableOpacity
          onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
          style={[
            micButton,
            isRecording && { backgroundColor: theme.colors.error }
          ]}>
          <Icon
            name={isRecording ? 'mic-off' : 'mic'}
            size={24}
            color={isRecording ? theme.colors.onError : theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      )}

      {isSendButtonVisible && (
        <SendButton onPress={handleSend} />
      )}
      
      {isStopVisible && (
        <StopButton onPress={onStopPress} />
      )}
    </View>
  );
};
