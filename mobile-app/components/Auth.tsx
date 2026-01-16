import React, { useState } from 'react';
import {
    Text,
    TextInput,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../contexts/auth-context';

export default function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading } = useAuth();

    async function signInWithEmail() {
        if (!email || !password) return;
        await login(email, password);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                className="px-4"
            >
                <View className="w-full max-w-sm bg-card rounded-xl shadow-xl border border-border overflow-hidden">

                    {/* Header Section */}
                    <View className="p-6 pb-0 items-center">
                        <View className="mx-auto mb-4 w-16 h-16 bg-primary rounded-md items-center justify-center p-3">
                            <Image
                                source={require('../assets/images/icon.png')}
                                style={{ width: 40, height: 40 }}
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-3xl font-bold text-card-foreground text-center">¡Bienvenido/a!</Text>
                        <Text className="text-muted-foreground text-center mt-2">
                            Inicia sesión para gestionar tus tareas de limpieza.
                        </Text>
                    </View>

                    {/* Content Section */}
                    <View className="p-6">
                        {/* Form Section */}
                        <View className="space-y-4">
                            <View>
                                <Text className="text-sm font-medium text-card-foreground mb-1.5">Correo Electrónico</Text>
                                <TextInput
                                    onChangeText={(text) => setEmail(text)}
                                    value={email}
                                    placeholder="tu@ejemplo.com"
                                    autoCapitalize={'none'}
                                    keyboardType="email-address"
                                    placeholderTextColor="#64748b"
                                    className="bg-input text-foreground rounded-lg p-3 border border-input h-11"
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-card-foreground mb-1.5">Contraseña</Text>
                                <View className="relative justify-center">
                                    <TextInput
                                        onChangeText={(text) => setPassword(text)}
                                        value={password}
                                        secureTextEntry={!showPassword}
                                        placeholder="••••••••"
                                        placeholderTextColor="#64748b"
                                        autoCapitalize={'none'}
                                        className="bg-input text-foreground rounded-lg p-3 border border-input pr-12 h-11"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 h-full justify-center px-1"
                                        activeOpacity={0.7}
                                    >
                                        {showPassword ?
                                            <EyeOff size={18} color="#64748b" /> :
                                            <Eye size={18} color="#64748b" />
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={signInWithEmail}
                                disabled={loading}
                                activeOpacity={0.8}
                                className={`bg-primary h-11 rounded-md items-center justify-center mt-2 ${loading ? 'opacity-70' : ''}`}
                            >
                                {loading ? (
                                    <View className="flex-row items-center gap-2">
                                        <ActivityIndicator color="white" size="small" />
                                        <Text className="text-primary-foreground font-medium">Iniciando sesión...</Text>
                                    </View>
                                ) : (
                                    <Text className="text-primary-foreground font-bold text-lg">Iniciar Sesión</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer Section */}
                    <View className="p-6 pt-0 flex-col gap-3">
                        <View className="flex-row justify-center flex-wrap">
                            <Text className="text-sm text-muted-foreground text-center">
                                ¿Aún no tienes cuenta? Regístra tu Empresa{" "}
                            </Text>
                            <TouchableOpacity>
                                <Text className="text-primary underline text-sm">Aquí</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center justify-center flex-wrap gap-x-1">
                            <TouchableOpacity>
                                <Text className="text-primary underline text-xs">Términos y condiciones</Text>
                            </TouchableOpacity>
                            <Text className="text-muted-foreground text-xs mx-0.5">•</Text>
                            <TouchableOpacity>
                                <Text className="text-primary underline text-xs">Política de privacidad</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
