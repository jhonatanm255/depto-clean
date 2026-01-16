import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { useData } from '../contexts/data-context';
import { CleaningTask, Department, EmployeeProfile } from '../lib/types';

interface EnrichedTask extends CleaningTask {
    department?: Department;
    employee?: EmployeeProfile;
}

export default function AssignmentsView() {
    const { tasks, departments, employees, assignTask, refreshData, dataLoading } = useData();
    const [modalVisible, setModalVisible] = useState(false);
    const [creating, setCreating] = useState(false);

    // New Assignment Form
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedEmp, setSelectedEmp] = useState('');

    // Prepare tasks for display
    const enrichedTasks: EnrichedTask[] = tasks.map(t => ({
        ...t,
        department: departments.find(d => d.id === t.departmentId),
        employee: employees.find(e => e.id === t.employeeId)
    }));

    async function handleAssign() {
        if (!selectedDept || !selectedEmp) return Alert.alert('Error', 'Selecciona departamento y empleada');

        setCreating(true);
        try {
            await assignTask(selectedDept, selectedEmp);
            Alert.alert('Éxito', 'Tarea asignada');
            setModalVisible(false);
            setSelectedDept('');
            setSelectedEmp('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al asignar tarea');
        } finally {
            setCreating(false);
        }
    }

    const renderTask = ({ item }: { item: EnrichedTask }) => (
        <View className="bg-white p-4 rounded-xl mb-3 border border-slate-200 shadow-sm">
            <View className="flex-row justify-between mb-2">
                <Text className="font-bold text-lg text-slate-800">
                    {item.department?.name || 'Depto. Desconocido'}
                </Text>
                <View className={`px-2 py-1 rounded-md ${item.status === 'completed' ? 'bg-green-100' :
                    item.status === 'in_progress' ? 'bg-blue-100' : 'bg-yellow-100'
                    }`}>
                    <Text className={`text-xs font-bold ${item.status === 'completed' ? 'text-green-700' :
                        item.status === 'in_progress' ? 'text-blue-700' : 'text-yellow-700'
                        }`}>
                        {item.status === 'completed' ? 'Completada' :
                            item.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                    </Text>
                </View>
            </View>
            <Text className="text-slate-600 text-base mb-1">
                Asignado a: <Text className="font-bold text-slate-800">{item.employee?.fullName || 'Sin nombre'}</Text>
            </Text>
            <Text className="text-xs text-slate-400">
                {new Date(item.createdAt).toLocaleDateString()} - {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50 px-4 pt-4">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-3xl font-bold text-slate-800">Asignaciones</Text>
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    className="bg-orange-500 p-3 rounded-full shadow-lg shadow-orange-200"
                >
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={enrichedTasks}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={dataLoading} onRefresh={refreshData} />}
                renderItem={renderTask}
                ListEmptyComponent={
                    <Text className="text-center text-slate-400 mt-10 text-lg">No hay tareas recientes</Text>
                }
            />

            {/* Create Modal */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-white rounded-t-3xl p-6 shadow-2xl h-3/4">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-slate-800">Nueva Asignación</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-slate-600 font-bold mb-2">Departamento</Text>
                        <FlatList
                            data={departments}
                            keyExtractor={item => item.id}
                            style={{ maxHeight: 200, marginBottom: 20 }}
                            nestedScrollEnabled
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => setSelectedDept(item.id)}
                                    className={`p-3 border rounded-lg mb-2 ${selectedDept === item.id ? 'bg-orange-50 border-orange-500' : 'bg-slate-50 border-slate-200'}`}
                                >
                                    <Text className={`font-bold ${selectedDept === item.id ? 'text-orange-700' : 'text-slate-700'}`}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />

                        <Text className="text-slate-600 font-bold mb-2">Empleada</Text>
                        <FlatList
                            data={employees}
                            keyExtractor={item => item.id}
                            style={{ maxHeight: 200, marginBottom: 20 }}
                            nestedScrollEnabled
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => setSelectedEmp(item.id)}
                                    className={`p-3 border rounded-lg mb-2 ${selectedEmp === item.id ? 'bg-orange-50 border-orange-500' : 'bg-slate-50 border-slate-200'}`}
                                >
                                    <Text className={`font-bold ${selectedEmp === item.id ? 'text-orange-700' : 'text-slate-700'}`}>{item.fullName}</Text>
                                </TouchableOpacity>
                            )}
                        />

                        <TouchableOpacity
                            onPress={handleAssign}
                            className={`bg-orange-500 p-4 rounded-xl items-center mt-auto mb-4 ${creating ? 'opacity-70' : ''}`}
                            disabled={creating}
                        >
                            <Text className="text-white font-bold text-xl">{creating ? 'Asignando...' : 'Confirmar Asignación'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
