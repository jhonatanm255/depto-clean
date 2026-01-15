import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { CleaningTask, TaskStatus } from '../lib/types';
import TaskCard from './TaskCard';
import { CheckSquare, Clock, History, LogOut } from 'lucide-react-native';
import { useAuth } from '../contexts/auth-context';
import { useData } from '../contexts/data-context';

export default function EmployeeDashboard() {
    const { currentUser, logout } = useAuth();
    const {
        getTasksForEmployee,
        getDepartmentById,
        updateTaskStatus,
        refreshData,
        dataLoading
    } = useData();

    const [activeTab, setActiveTab] = useState<'pending' | 'completed_today'>('pending');

    const tasks = useMemo(() => {
        if (!currentUser) return [];
        return getTasksForEmployee(currentUser.id);
    }, [currentUser, getTasksForEmployee]);

    const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
        try {
            await updateTaskStatus(taskId, status);
        } catch (error: any) {
            Alert.alert('Error actualizando tarea', error.message);
        }
    };

    const isToday = (dateString: string | undefined) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    const pendingTasks = useMemo(() =>
        tasks.filter(t => t.status === 'pending' || t.status === 'in_progress'),
        [tasks]);

    const completedTodayTasks = useMemo(() =>
        tasks.filter(t => t.status === 'completed' && isToday(t.completedAt)),
        [tasks]);

    const userName = currentUser?.fullName || currentUser?.name || currentUser?.email?.split('@')[0] || 'Hola';

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white px-4 pt-12 pb-4 border-b border-slate-200">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-2xl font-bold text-slate-800 font-headline">Hola,</Text>
                        <Text className="text-lg text-slate-500">{userName}</Text>
                    </View>
                    <TouchableOpacity onPress={logout} className="bg-slate-100 p-2 rounded-full">
                        <LogOut size={20} className="text-slate-600" color="#475569" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View className="flex-row bg-slate-100 p-1 rounded-lg">
                    <TouchableOpacity
                        className={`flex-1 flex-row items-center justify-center py-2 rounded-md ${activeTab === 'pending' ? 'bg-white shadow-sm' : ''}`}
                        onPress={() => setActiveTab('pending')}
                    >
                        <CheckSquare size={16} className={`mr-2 ${activeTab === 'pending' ? 'text-primary' : 'text-slate-500'}`} color={activeTab === 'pending' ? 'hsl(215 50% 23%)' : '#64748b'} />
                        <Text className={`font-bold ${activeTab === 'pending' ? 'text-primary' : 'text-slate-500'}`}>Pendientes ({pendingTasks.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 flex-row items-center justify-center py-2 rounded-md ${activeTab === 'completed_today' ? 'bg-white shadow-sm' : ''}`}
                        onPress={() => setActiveTab('completed_today')}
                    >
                        <Clock size={16} className={`mr-2 ${activeTab === 'completed_today' ? 'text-primary' : 'text-slate-500'}`} color={activeTab === 'completed_today' ? 'hsl(215 50% 23%)' : '#64748b'} />
                        <Text className={`font-bold ${activeTab === 'completed_today' ? 'text-primary' : 'text-slate-500'}`}>Hoy ({completedTodayTasks.length})</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-4 pt-4"
                refreshControl={<RefreshControl refreshing={dataLoading} onRefresh={refreshData} tintColor="#1e293b" />}
            >
                {activeTab === 'pending' ? (
                    pendingTasks.length > 0 ? (
                        pendingTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                department={getDepartmentById(task.departmentId)}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))
                    ) : (
                        <View className="items-center py-10">
                            <CheckSquare size={48} className="text-slate-300 mb-4" color="#cbd5e1" />
                            <Text className="text-xl font-bold text-slate-400">¡Todo al día!</Text>
                            <Text className="text-slate-400 mt-2">No tienes tareas pendientes.</Text>
                        </View>
                    )
                ) : (
                    completedTodayTasks.length > 0 ? (
                        completedTodayTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                department={getDepartmentById(task.departmentId)}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))
                    ) : (
                        <View className="items-center py-10">
                            <History size={48} className="text-slate-300 mb-4" color="#cbd5e1" />
                            <Text className="text-xl font-bold text-slate-400">Sin actividad hoy</Text>
                            <Text className="text-slate-400 mt-2">Las tareas completadas hoy aparecerán aquí.</Text>
                        </View>
                    )
                )}
                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
