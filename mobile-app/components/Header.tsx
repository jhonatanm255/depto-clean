import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Moon, Sun, LogOut, User, Settings, X, CreditCard } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useColorScheme } from 'nativewind';

interface HeaderProps {
    userName?: string;
}

export default function Header({ userName }: HeaderProps) {
    const [menuVisible, setMenuVisible] = useState(false);
    const [notifVisible, setNotifVisible] = useState(false);
    const { colorScheme, toggleColorScheme } = useColorScheme();

    const handleLogout = async () => {
        setMenuVisible(false);
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert('Error', error.message);
    };

    return (
        <SafeAreaView edges={['top']} className="bg-slate-900 dark:bg-slate-950 z-50 shadow-md">
            <View className="flex-row justify-between items-center px-4 py-3">
                {/* Brand */}
                <View className="flex-row items-center">
                    <Text className="text-white font-bold text-xl tracking-tight">LimFull</Text>
                    <Text className="text-blue-400 font-bold text-xl">Spa</Text>
                </View>

                {/* Actions */}
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => setNotifVisible(true)} className="p-2 rounded-full active:bg-slate-800">
                        <View>
                            <Bell size={22} color="#94a3b8" />
                            <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-slate-900" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleColorScheme} className="p-2 rounded-full active:bg-slate-800">
                        {colorScheme === 'dark' ? (
                            <Sun size={22} color="#fbbf24" />
                        ) : (
                            <Moon size={22} color="#94a3b8" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setMenuVisible(true)}
                        className="w-9 h-9 bg-indigo-500 rounded-full justify-center items-center border-2 border-slate-800"
                    >
                        <Text className="text-white font-bold text-xs">
                            {userName?.substring(0, 2).toUpperCase() || 'US'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* User Menu Modal */}
            <Modal transparent={true} visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                <TouchableOpacity
                    className="flex-1 bg-black/50"
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View className="absolute top-28 right-4 bg-white dark:bg-slate-900 rounded-xl shadow-xl w-64 overflow-hidden border border-slate-100 dark:border-slate-800">
                        <View className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                            <Text className="font-bold text-slate-800 dark:text-slate-100 text-lg">Mi Cuenta</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm">{userName}</Text>
                        </View>

                        <TouchableOpacity className="flex-row items-center p-4 active:bg-slate-50 dark:active:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                            <User size={20} color="#64748b" className="mr-3" />
                            <Text className="text-slate-700 dark:text-slate-300 font-medium">Perfil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-row items-center p-4 active:bg-slate-50 dark:active:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                            <CreditCard size={20} color="#64748b" className="mr-3" />
                            <Text className="text-slate-700 dark:text-slate-300 font-medium">Suscripciones</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-row items-center p-4 active:bg-slate-50 dark:active:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                            <Settings size={20} color="#64748b" className="mr-3" />
                            <Text className="text-slate-700 dark:text-slate-300 font-medium">Configuración</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleLogout} className="flex-row items-center p-4 active:bg-red-50 dark:active:bg-red-900/20">
                            <LogOut size={20} color="#ef4444" className="mr-3" />
                            <Text className="text-red-600 font-medium">Cerrar Sesión</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Notifications Modal */}
            <Modal transparent={true} visible={notifVisible} animationType="fade" onRequestClose={() => setNotifVisible(false)}>
                <View className="flex-1 bg-black/50 justify-center px-6">
                    <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-800 dark:text-white">Notificaciones</Text>
                            <TouchableOpacity onPress={() => setNotifVisible(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <View className="items-center py-8">
                            <Bell size={48} color="#e2e8f0" />
                            <Text className="text-slate-500 dark:text-slate-400 mt-4 text-center">No tienes notificaciones nuevas</Text>
                        </View>
                        <TouchableOpacity onPress={() => setNotifVisible(false)} className="bg-slate-100 dark:bg-slate-800 py-3 rounded-xl items-center mt-2">
                            <Text className="text-slate-700 dark:text-slate-300 font-bold">Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
