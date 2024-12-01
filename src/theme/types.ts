import {MD3Theme} from 'react-native-paper';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import {ColorValue} from 'react-native';

export interface Colors extends MD3Colors {
  accent: string;
  outlineVariant: string;
  receivedMessageDocumentIcon: string;
  sentMessageDocumentIcon: string;
  userAvatarImageBackground: string;
  userAvatarNameColors: ColorValue[];
  searchBarBackground: string;
}

export interface Theme extends MD3Theme {
  colors: Colors;
} 