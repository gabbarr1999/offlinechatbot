import {StyleSheet} from 'react-native';
import {Theme} from '../../theme/types';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: {
      alignItems: 'center',
      padding: 20,
    },
    statusText: {
      marginVertical: 20,
      fontSize: 16,
      color: theme.colors.onBackground,
      textAlign: 'center',
    },
    errorText: {
      color: theme.colors.error,
      marginTop: 10,
    },
    progressBar: {
      marginTop: 10,
    },
  }); 