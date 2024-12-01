import {StyleSheet} from 'react-native';

import {getUserAvatarNameColor} from '../../utils';
import {MessageType, Theme, User} from '../../utils/types';

export const styles = ({
  message,
  theme,
  user,
}: {
  message: MessageType.Text;
  theme: Theme;
  user?: User;
}) =>
  StyleSheet.create({
    descriptionText: {
      ...(user?.id === message.author.id
        ? theme.fonts.sentMessageLinkDescriptionTextStyle
        : theme.fonts.receivedMessageLinkDescriptionTextStyle),
      marginTop: 4,
      color: '#FFFFFF',
    },
    headerText: {
      ...theme.fonts.userNameTextStyle,
      color: getUserAvatarNameColor(
        message.author,
        theme.colors.userAvatarNameColors,
      ),
      marginBottom: 6,
    },
    titleText: {
      ...(user?.id === message.author.id
        ? theme.fonts.sentMessageLinkTitleTextStyle
        : theme.fonts.receivedMessageLinkTitleTextStyle),
      color: '#FFFFFF',
    },
    text: {
      ...(user?.id === message.author.id
        ? theme.fonts.sentMessageBodyTextStyle
        : theme.fonts.receivedMessageBodyTextStyle),
      color: '#FFFFFF',
    },
    textContainer: {
      marginHorizontal: theme.insets.messageInsetsHorizontal,
      marginVertical: theme.insets.messageInsetsVertical,
    },
  });
