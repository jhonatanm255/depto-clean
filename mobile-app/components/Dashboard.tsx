import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Image } from 'react-native'
import { Session } from '@supabase/supabase-js'
import {
    AlertTriangle,
    Activity,
    Building,
    Users,
    LayoutGrid,
    ClipboardList,
    LogOut
} from 'lucide-react-native'
import { TouchableOpacity } from 'react-native'
import { Stack } from 'expo-router';
import { useAuth } from '../contexts/auth-context';
import { useData } from '../contexts/data-context';

// Components
import Header from './Header';
import DepartmentsView from './DepartmentsView';
import EmployeesView from './EmployeesView';
import AssignmentsView from './AssignmentsView';
import EmployeeDashboard from './EmployeeDashboard';

type Tab = 'panel' | 'deptos' | 'empleadas' | 'asignar';

export default function Dashboard() {
    const { currentUser, logout, loading: authLoading } = useAuth();
    const {
        departments,
        employees,
        tasks,
        dataLoading: appLoading,
        refreshData
    } = useData();

    const [activeTab, setActiveTab] = useState<Tab>('panel');
    const [stats, setStats] = useState({
        pending: 0,
        inProgress: 0,
        completedToday: 0,
        totalDepts: 0,
        totalEmployees: 0
    });

    // Derived state for loading
    const loading = authLoading || (appLoading && departments.length === 0);

    const userName = currentUser?.fullName || currentUser?.name || currentUser?.email?.split('@')[0] || 'Usuario';
    const isEmployee = currentUser?.role === 'employee' || currentUser?.role === 'manager';

    useEffect(() => {
        if (!isEmployee) {
            calculateStats();
        }
    }, [departments, tasks, employees, isEmployee]);

    function calculateStats() {
        // Calculate stats from Context data instead of fetching again
        const pending = departments.filter(d => d.status === 'pending').length;
        const inProgress = departments.filter(d => d.status === 'in_progress').length;
        const totalDepts = departments.length;
        const totalEmp = employees.length;

        // Simple today check for tasks
        const today = new Date().toISOString().split('T')[0];
        // Note: this is a rough check, ideally use proper date util
        const completedToday = tasks.filter(t =>
            t.status === 'completed' && t.completedAt && t.completedAt.startsWith(today)
        ).length;

        setStats({
            pending,
            inProgress,
            completedToday,
            totalDepts,
            totalEmployees: totalEmp
        });
    }

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <ActivityIndicator size="large" color="#1D3658" />
            </View>
        )
    }

    // Role-based Routing
    if (isEmployee) {
        // EmployeeDashboard handles its own data fetching or should be refactored too
        return <EmployeeDashboard />;
        // Note: EmployeeDashboard still expects session, I should refactor it later or pass minimal object
    }

    // Admin Dashboard View
    return (
        <View className="flex-1 bg-slate-50">
            {/* Admin Header with Logout */}
            <View className="bg-white px-4 pt-12 pb-4 border-b border-slate-200 flex-row justify-between items-center">
                <View>
                    <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">Administrador</Text>
                    <Text className="text-xl font-bold text-slate-800 font-headline">{userName}</Text>
                </View>
                <TouchableOpacity onPress={() => logout()} className="bg-slate-100 p-2 rounded-full">
                    <LogOut size={20} className="text-slate-600" color="#475569" />
                </TouchableOpacity>
            </View>

            <View className="flex-1">
                {activeTab === 'panel' && (
                    <ScrollView
                        className="flex-1 px-4 pb-24"
                        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshData} tintColor="#1e293b" />}
                    >
                        <View className="mb-6 mt-4">
                            <Text className="text-3xl font-bold text-slate-800">Panel General</Text>
                            <Text className="text-slate-500 font-medium mt-1">
                                Resumen de actividad en tiempo real.
                            </Text>
                        </View>

                        <View className="gap-4">
                            <View className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex-row justify-between items-start">
                                <View>
                                    <Text className="text-slate-500 font-medium mb-2">Tareas Pendientes (Depto)</Text>
                                    <Text className="text-4xl font-bold text-slate-800">{stats.pending}</Text>
                                </View>
                                <AlertTriangle size={24} color="#eab308" />
                            </View>

                            <View className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex-row justify-between items-start">
                                <View>
                                    <Text className="text-slate-500 font-medium mb-2">Tareas en Progreso</Text>
                                    <Text className="text-4xl font-bold text-slate-800">{stats.inProgress}</Text>
                                </View>
                                <Activity size={24} color="#1e293b" />
                            </View>

                            <View className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex-row justify-between items-start">
                                <View>
                                    <Text className="text-slate-500 font-medium mb-2">Total Departamentos</Text>
                                    <Text className="text-4xl font-bold text-slate-800">{stats.totalDepts}</Text>
                                </View>
                                <Building size={24} color="#64748b" />
                            </View>

                            <View className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex-row justify-between items-start">
                                <View>
                                    <Text className="text-slate-500 font-medium mb-2">Total Empleadas</Text>
                                    <Text className="text-4xl font-bold text-slate-800">{stats.totalEmployees}</Text>
                                </View>
                                <Users size={24} color="#64748b" />
                            </View>
                        </View>
                    </ScrollView>
                )}

                {activeTab === 'deptos' && <DepartmentsView />}
                {activeTab === 'empleadas' && <EmployeesView />}
                {activeTab === 'asignar' && <AssignmentsView />}
            </View>

            {/* Bottom Tab Bar */}
            <View className="bg-slate-900 flex-row pb-6 pt-3 justify-around border-t border-slate-800 shadow-lg">
                {[
                    { key: 'panel', icon: LayoutGrid, label: 'Panel' },
                    { key: 'deptos', icon: Building, label: 'Deptos' },
                    { key: 'asignar', icon: ClipboardList, label: 'Asignar' },
                    { key: 'empleadas', icon: Users, label: 'Empleadas' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key as Tab)}
                        className={`items-center px-4 py-2 rounded-xl transition-all ${activeTab === tab.key ? 'bg-orange-500' : ''}`}
                    >
                        <tab.icon size={24} color={activeTab === tab.key ? 'white' : '#94a3b8'} />
                        <Text className={`text-[10px] mt-1 font-bold ${activeTab === tab.key ? 'text-white' : 'text-slate-400'}`}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )
}
