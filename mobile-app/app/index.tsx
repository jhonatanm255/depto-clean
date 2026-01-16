import { View, ActivityIndicator } from 'react-native'
import Auth from '../components/Auth'
import Dashboard from '../components/Dashboard'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '../contexts/auth-context'

export default function App() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-900">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        )
    }

    // Pass the session object derived from currentUser logic if needed, 
    // but Dashboard now expects 'session' prop which is Supabase Session.
    // However, Dashboard SHOULD strictly use useAuth/useData context now.
    // I will need to refactor Dashboard to NOT require session prop.
    // For now, I'll pass a mock session object or refactor Dashboard immediately after.
    // Let's refactor Dashboard first? No, parallel tool calls are not allowed.
    // I will refactor Dashboard to remove the prop in the next step.
    // Here, I will just render Dashboard without props and fix the type in Dashboard next.

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="auto" />
            {currentUser ? <Dashboard /> : <Auth />}
        </View>
    )
}
