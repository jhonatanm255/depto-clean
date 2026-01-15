import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { Search, Plus, X } from 'lucide-react-native';
import EmployeeCard from './EmployeeCard';
import { useData } from '../contexts/data-context';

export default function EmployeesView() {
    const { employees, tasks, departments, addEmployeeWithAuth, refreshData, dataLoading } = useData();
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    // Create Form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [creating, setCreating] = useState(false);

    // Prepare active tasks for display (enriched with Department info)
    const enrichedTasks = tasks.map(t => ({
        ...t,
        department: departments.find(d => d.id === t.departmentId)
    }));

    async function handleCreate() {
        if (!email || !password || !name) return Alert.alert('Error', 'Todos los campos son obligatorios');

        try {
            setCreating(true);
            await addEmployeeWithAuth(name, email, password);
            Alert.alert('Éxito', 'Empleada creada correctamente');
            setModalVisible(false);
            setName('');
            setEmail('');
            setPassword('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo crear la empleada');
        } finally {
            setCreating(false);
        }
    }

    const filteredEmp = employees.filter(e =>
        (e.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View className="flex-1 bg-slate-50 px-4 pt-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-3xl font-bold text-slate-800">Empleadas</Text>
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    className="bg-orange-500 w-12 h-12 rounded-full items-center justify-center shadow-lg shadow-orange-200"
                >
                    <Plus color="white" size={28} />
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3 mb-6 shadow-sm">
                <Search size={24} color="#94a3b8" />
                <TextInput
                    placeholder="Buscar empleada..."
                    className="flex-1 ml-3 text-lg text-slate-700"
                    placeholderTextColor="#94a3b8"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <FlatList
                data={filteredEmp}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={dataLoading} onRefresh={refreshData} />}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                    <EmployeeCard employee={item} tasks={enrichedTasks} />
                )}
            />

            {/* Create Modal */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-white rounded-t-3xl p-8 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-2xl font-bold text-slate-800">Nueva Empleada</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-6">
                            <View>
                                <Text className="text-slate-600 font-bold mb-2 text-base">Nombre Completo</Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-lg text-slate-800"
                                    placeholder="Ej. Ana Pérez"
                                />
                            </View>

                            <View>
                                <Text className="text-slate-600 font-bold mb-2 text-base">Correo Electrónico</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-lg text-slate-800"
                                    placeholder="ana@limfull.com"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View>
                                <Text className="text-slate-600 font-bold mb-2 text-base">Contraseña</Text>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-lg text-slate-800"
                                    placeholder="******"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleCreate}
                            className={`bg-orange-500 p-5 rounded-xl items-center mt-8 shadow-lg shadow-orange-200 ${creating ? 'opacity-70' : ''}`}
                            disabled={creating}
                        >
                            <Text className="text-white font-bold text-xl">{creating ? 'Creando...' : 'Crear Cuenta'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
