import { StyleSheet } from 'react-native';

export const colors = {
  background: '#F4F7F7',
  primary: '#073F48',
  primaryDark: '#063F46',
  accent: '#4AA9B8',
  white: '#FFFFFF',
  muted: '#C8D6D9',
  border: '#DDDDDD',
  danger: '#C0392B',
  success: '#00C853',
  warning: '#FF9800',
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    height: 86,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingTop: 34,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  tabBar: {
    backgroundColor: '#073B4C',
    height: 70,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 0,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
