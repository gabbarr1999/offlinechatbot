import * as React from 'react';
import {
  GestureResponderEvent,
  Image,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  ImageStyle,
  StyleProp,
} from 'react-native';

import {useTheme} from '../../hooks';

import {L10nContext} from '../../utils';

export interface AttachmentButtonAdditionalProps {
  touchableOpacityProps?: TouchableOpacityProps;
  imageStyle?: StyleProp<ImageStyle>;
}

export interface AttachmentButtonProps extends AttachmentButtonAdditionalProps {
  /** Callback for attachment button tap event */
  onPress?: () => void;
}

export const AttachmentButton = ({
  onPress,
  touchableOpacityProps,
  imageStyle,
}: AttachmentButtonProps) => {
  const l10n = React.useContext(L10nContext);
  const theme = useTheme();

  const handlePress = (event: GestureResponderEvent) => {
    onPress?.();
    touchableOpacityProps?.onPress?.(event);
  };

  return (
    <TouchableOpacity
      accessibilityLabel={l10n.attachmentButtonAccessibilityLabel}
      accessibilityRole="button"
      testID="attachment-button"
      {...touchableOpacityProps}
      onPress={handlePress}>
      {theme.icons?.attachmentButtonIcon?.() ?? (
        <Image
          source={require('../../assets/icon-attachment.png')}
          style={[styles.image, imageStyle]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  image: {
    marginRight: 16,
    width: 24,
    height: 24,
  },
});
