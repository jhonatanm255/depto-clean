import React from 'react';
import { View, Text } from 'react-native';
import { User, Mail, Briefcase, Building } from 'lucide-react-native';
import { EmployeeProfile, CleaningTask, Department } from '../lib/types';

interface ExtendedTask extends CleaningTask {
    department?: Department;
}

interface EmployeeCardProps {
    employee: EmployeeProfile;
    tasks: ExtendedTask[];
}

export default function EmployeeCard({ employee, tasks }: EmployeeCardProps) {
    // Filter tasks for this employee
    const assignedTasks = tasks.filter(t => t.employeeId === employee.id && t.status !== 'completed');

    // Status helpers reused
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-700 bg-green-100';
            case 'in_progress': return 'text-blue-700 bg-blue-100';
            case 'pending': return 'text-yellow-700 bg-yellow-100';
            default: return 'text-slate-700 bg-slate-100';
        }
    };
    const translateStatus = (status: string) => {
        switch (status) {
            case 'completed': return 'Limpio';
            case 'in_progress': return 'En curso';
            case 'pending': return 'Pendiente';
            default: return status;
        }
    };

    return (
        <View className="bg-white p-5 rounded-2xl mb-4 border border-slate-200 shadow-sm">
            <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-indigo-50 rounded-full justify-center items-center mr-4">
                    <User size={24} color="#6366f1" />
                </View>
                <View>
                    <Text className="text-xl font-bold text-slate-800">{employee.fullName}</Text>
                    <View className="flex-row items-center mt-1">
                        <Mail size={14} color="#64748b" />
                        <Text className="text-slate-500 text-sm ml-1.5">{employee.email}</Text>
                    </View>
                </View>
            </View>

            {/* Assigned Tasks Tiny List */}
            {assignedTasks.length > 0 ? (
                <View className="border-t border-slate-100 pt-3">
                    <View className="flex-row items-center mb-3">
                        <Briefcase size={16} color="#0EA5E9" />
                        <Text className="text-sm font-bold text-slate-700 ml-2">Tareas Activas ({assignedTasks.length})</Text>
                    </View>
                    <View className="space-y-3">
                        {assignedTasks.map((task) => (
                            <View key={task.id} className="bg-slate-50 p-3 rounded-xl flex-row justify-between items-center border border-slate-100">
                                <View className="flex-1">
                                    <View className="flex-row items-center">
                                        <Building size={16} color="#64748b" />
                                        <Text className="text-sm font-bold text-slate-700 ml-2">
                                            {task.department?.name || 'Departamento desconocido'}
                                        </Text>
                                    </View>
                                    {task.department?.address && (
                                        <Text className="text-xs text-slate-500 ml-6 truncate mt-0.5">
                                            {task.department.address}
                                        </Text>
                                    )}
                                </View>
                                <View className={`px-2 py-1 rounded-md ${getStatusColor(task.status).split(' ')[1]}`}>
                                    <Text className={`text-xs font-bold ${getStatusColor(task.status).split(' ')[0]}`}>
                                        {translateStatus(task.status)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            ) : (
                <View className="border-t border-slate-100 pt-3">
                    <Text className="text-sm text-slate-400 italic">Sin tareas activas asignadas.</Text>
                </View>
            )}
        </View>
    );
}
