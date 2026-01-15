import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import { AuthProvider } from '../contexts/auth-context';
import { DataProvider } from '../contexts/data-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DataProvider>
        <SafeAreaProvider>
          <Slot />
        </SafeAreaProvider>
      </DataProvider>
    </AuthProvider>
  );
}
