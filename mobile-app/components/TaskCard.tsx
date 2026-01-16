import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { CleaningTask, Department, TaskStatus } from '../lib/types';
import { Building, MapPin, Key, Calendar, CheckCircle, AlertTriangle, Loader, ExternalLink, UploadCloud } from 'lucide-react-native';

interface TaskCardProps {
    task: CleaningTask;
    department?: Department;
    onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

export default function TaskCard({ task, department, onUpdateStatus }: TaskCardProps) {
    if (!department) return null;

    const translateStatus = (status: TaskStatus) => {
        switch (status) {
            case 'completed': return 'Completada';
            case 'in_progress': return 'En Progreso';
            case 'pending': return 'Pendiente';
            default: return status;
        }
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleMaps = () => {
        if (department.address) {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(department.address)}`;
            Linking.openURL(url);
        }
    };

    const handleStatusChange = async (newStatus: TaskStatus) => {
        try {
            await onUpdateStatus(task.id, newStatus);
        } catch (error) {
            Alert.alert("Error", "No se pudo actualizar el estado");
        }
    };

    return (
        <View className="bg-card rounded-xl shadow-sm border border-border mb-4 overflow-hidden">
            {/* Header */}
            <View className="p-4 border-b border-border">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-row items-center flex-1 mr-2">
                        <Building size={20} className="text-primary mr-2" color="hsl(215 50% 23%)" />
                        <Text className="text-lg font-bold text-card-foreground flex-shrink" numberOfLines={1}>
                            {department.name}
                        </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${getStatusColor(task.status).split(' ')[0]}`}>
                        <Text className={`text-xs font-bold ${getStatusColor(task.status).split(' ')[1]}`}>
                            {translateStatus(task.status)}
                        </Text>
                    </View>
                </View>

                {department.accessCode && (
                    <View className="flex-row items-center mt-1">
                        <Key size={14} className="text-muted-foreground mr-1" color="#64748b" />
                        <Text className="text-sm text-muted-foreground">
                            Código: <Text className="font-medium text-foreground">{department.accessCode}</Text>
                        </Text>
                    </View>
                )}

                {department.address && (
                    <View className="flex-row items-start mt-1">
                        <MapPin size={14} className="text-muted-foreground mr-1 mt-0.5" color="#64748b" />
                        <Text className="text-sm text-muted-foreground flex-1" numberOfLines={2}>
                            {department.address}
                        </Text>
                    </View>
                )}
            </View>

            {/* Content */}
            <View className="p-4 bg-transparent">
                <View className="flex-row items-center mb-1">
                    <Calendar size={14} className="text-muted-foreground mr-2" color="#64748b" />
                    <Text className="text-sm text-muted-foreground">
                        Asignada: {new Date(task.assignedAt).toLocaleDateString('es-CL')}
                    </Text>
                </View>

                {task.status === 'completed' && task.completedAt && (
                    <View className="flex-row items-center mb-3">
                        <CheckCircle size={14} className="text-green-600 mr-2" color="#16a34a" />
                        <Text className="text-sm text-green-600 font-medium">
                            Completada: {new Date(task.completedAt).toLocaleDateString('es-CL')}
                        </Text>
                    </View>
                )}

                {/* Buttons Row */}
                <View className="flex-row gap-2 mt-3 flex-wrap">
                    {department.address && (
                        <TouchableOpacity
                            onPress={handleMaps}
                            className="bg-secondary px-3 py-2 rounded-md flex-row items-center justify-center flex-1"
                        >
                            <ExternalLink size={16} className="text-secondary-foreground mr-2" color="#334155" />
                            <Text className="text-secondary-foreground font-medium text-xs">Mapa</Text>
                        </TouchableOpacity>
                    )}

                    {/* <TouchableOpacity 
                        className="bg-secondary px-3 py-2 rounded-md flex-row items-center justify-center flex-1"
                        disabled={task.status === 'completed'}
                    >
                        <UploadCloud size={16} className="text-secondary-foreground mr-2" color="#334155" />
                        <Text className="text-secondary-foreground font-medium text-xs">Evidencia</Text>
                    </TouchableOpacity> */}
                </View>
            </View>

            {/* Actions Footer */}
            {task.status !== 'completed' && (
                <View className="p-4 bg-muted/20 border-t border-border flex-row gap-2 justify-end">
                    {task.status === 'pending' && (
                        <TouchableOpacity
                            onPress={() => handleStatusChange('in_progress')}
                            className="bg-white border border-border px-3 py-2 rounded-md flex-row items-center"
                        >
                            <Loader size={16} className="text-foreground mr-2" color="#0f172a" />
                            <Text className="text-foreground font-medium text-sm">Iniciar</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={() => handleStatusChange('completed')}
                        className="bg-green-600 px-3 py-2 rounded-md flex-row items-center"
                    >
                        <CheckCircle size={16} className="text-white mr-2" color="white" />
                        <Text className="text-white font-bold text-sm">Completar</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
