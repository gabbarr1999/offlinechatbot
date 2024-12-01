import {StyleSheet} from 'react-native';

import {Theme} from '../../utils/types';

export const styles = ({theme}: {theme: Theme}) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: 40,
      textAlignVertical: 'center',
      paddingHorizontal: 8,
      fontSize: 16,
      backgroundColor: theme.colors.surface,
      color: theme.colors.onSurface,
      borderRadius: 20,
      marginHorizontal: 8,
    },
    marginRight: {
      marginRight: 8,
    },
    imagePreview: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      marginRight: 8,
    },
    previewImage: {
      width: 60,
      height: 60,
      borderRadius: 4,
      marginRight: 8,
    },
    micButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceVariant,
    },
  });
