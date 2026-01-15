import React from 'react';
import { View, Text } from 'react-native';
import { Building, Key, MapPin, User, AlertTriangle, CheckCircle, Clock } from 'lucide-react-native';
import { Department, EmployeeProfile } from '../lib/types';

interface DepartmentCardProps {
    department: Department;
    employees?: EmployeeProfile[]; // To find assignee name
}

export default function DepartmentCard({ department, employees = [] }: DepartmentCardProps) {
    const assignedEmp = department.assignedTo
        ? employees.find(e => e.id === department.assignedTo)
        : null;

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'completed': return { text: 'Limpio', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle };
            case 'in_progress': return { text: 'En Progreso', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock };
            case 'pending': return { text: 'Necesita Limpieza', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: AlertTriangle };
            default: return { text: status, color: 'text-slate-700', bg: 'bg-slate-100', icon: Building };
        }
    };

    const statusInfo = getStatusInfo(department.status);
    const StatusIcon = statusInfo.icon;

    return (
        <View className="bg-white p-5 rounded-2xl mb-4 border border-slate-200 shadow-sm">
            {/* Header: Name & Status Badge */}
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-2">
                    <View className="flex-row items-center mb-2">
                        <Building size={22} color="#0EA5E9" className="mr-2" />
                        <Text className="text-xl font-bold text-slate-800 flex-shrink">{department.name}</Text>
                    </View>
                    <View className={`self-start flex-row items-center px-3 py-1.5 rounded-lg ${statusInfo.bg}`}>
                        <StatusIcon size={16} color={statusInfo.color.includes('green') ? '#15803d' : statusInfo.color.includes('blue') ? '#1d4ed8' : '#a16207'} />
                        <Text className={`text-sm font-bold ml-2 ${statusInfo.color}`}>
                            {statusInfo.text}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Details: Access Code & Address */}
            <View className="space-y-2 mb-4">
                <View className="flex-row items-center">
                    <Key size={18} color="#64748b" />
                    <Text className="text-slate-500 text-base ml-2">
                        Código: <Text className="text-slate-800 font-bold">{department.accessCode || 'N/A'}</Text>
                    </Text>
                </View>
                {department.address && (
                    <View className="flex-row items-center">
                        <MapPin size={18} color="#64748b" />
                        <Text className="text-slate-500 text-sm ml-2 w-[90%] leading-5">{department.address}</Text>
                    </View>
                )}
            </View>

            {/* Department Configuration */}
            <View className="flex-row flex-wrap gap-4 mb-4 pt-3 border-t border-slate-50">
                <View className="flex-row items-center">
                    <Text className="text-slate-500 text-xs uppercase font-bold mr-2 text-[10px]">Hab.</Text>
                    <Text className="text-slate-800 font-bold">{department.bedrooms ?? 0}</Text>
                </View>
                <View className="flex-row items-center">
                    <Text className="text-slate-500 text-xs uppercase font-bold mr-2 text-[10px]">Baños</Text>
                    <Text className="text-slate-800 font-bold">{department.bathrooms ?? 0}</Text>
                </View>
                <View className="flex-row items-center">
                    <Text className="text-slate-500 text-xs uppercase font-bold mr-2 text-[10px]">Camas</Text>
                    <Text className="text-slate-800 font-bold">{department.bedsCount ?? 0}</Text>
                </View>
            </View>

            {/* Beds Distribution */}
            {department.beds && department.beds.length > 0 && (
                <View className="mb-4 space-y-1">
                    <Text className="text-slate-400 text-[10px] uppercase font-bold">Distribución de Camas</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {department.beds.map((bed, idx) => (
                            <View key={idx} className="bg-slate-50 border border-slate-100 px-2 py-1 rounded">
                                <Text className="text-slate-600 text-[11px]">
                                    <Text className="capitalize">{bed.type.replace('_', ' ')}</Text>: <Text className="font-bold">{bed.quantity}</Text>
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Custom Fields */}
            {department.customFields && department.customFields.length > 0 && (
                <View className="mb-4 space-y-1">
                    <Text className="text-slate-400 text-[10px] uppercase font-bold">Información Adicional</Text>
                    <View className="space-y-1">
                        {department.customFields.map((field, idx) => (
                            <View key={idx} className="flex-row justify-between items-center bg-slate-50/50 px-2 py-1 rounded">
                                <Text className="text-slate-500 text-[11px]">{field.name}:</Text>
                                <Text className="text-slate-800 text-[11px] font-bold">{field.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Assignee Logic */}
            <View className="border-t border-slate-100 pt-3 flex-row items-center justify-between">
                {assignedEmp && (department.status === 'pending' || department.status === 'in_progress') ? (
                    <View className="flex-row items-center">
                        <User size={16} color="#475569" />
                        <Text className="text-slate-600 text-sm ml-2">
                            Asignado a: <Text className="text-slate-900 font-bold">{assignedEmp.fullName}</Text>
                        </Text>
                    </View>
                ) : !assignedEmp && department.status === 'pending' ? (
                    <View className="flex-row items-center">
                        <AlertTriangle size={16} color="#ca8a04" />
                        <Text className="text-yellow-700 text-sm ml-2 font-bold">Necesita asignación</Text>
                    </View>
                ) : department.status === 'completed' ? (
                    <View className="flex-row items-center">
                        <CheckCircle size={16} color="#15803d" />
                        <Text className="text-green-700 text-sm ml-2 font-bold">Listo para usar</Text>
                    </View>
                ) : <View />}

                {department.lastCleanedAt && (
                    <Text className="text-xs text-slate-400">
                        Ult. {new Date(department.lastCleanedAt).toLocaleDateString()}
                    </Text>
                )}
            </View>
        </View>
    );
}
