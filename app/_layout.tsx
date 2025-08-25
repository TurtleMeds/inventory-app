import { Stack } from 'expo-router';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet } from 'react-native';

const RootLayout = () => {
  return (
    <>
      <StatusBar barStyle='dark-content' />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flexGrow: 1,
    paddingTop: 30,
    padding: 16,
  },
});

export default RootLayout;
