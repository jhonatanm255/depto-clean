import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Modal, Alert, RefreshControl } from 'react-native';
import { Building, Search, Plus, X } from 'lucide-react-native';
import DepartmentCard from './DepartmentCard';
import { useData } from '../contexts/data-context';

export default function DepartmentsView() {
    const { departments, employees, addDepartment, refreshData, dataLoading } = useData();
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    // New Dept Form
    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newCode, setNewCode] = useState('');
    const [newBedrooms, setNewBedrooms] = useState('0');
    const [newBathrooms, setNewBathrooms] = useState('0');
    const [newIndividual, setNewIndividual] = useState('0');
    const [newMatrimonial, setNewMatrimonial] = useState('0');
    const [newKing, setNewKing] = useState('0');
    const [creating, setCreating] = useState(false);

    async function handleCreate() {
        if (!newName) return Alert.alert('Error', 'El nombre es obligatorio');

        setCreating(true);
        try {
            const beds = [
                { type: 'individual' as const, quantity: parseInt(newIndividual) || 0 },
                { type: 'matrimonial' as const, quantity: parseInt(newMatrimonial) || 0 },
                { type: 'king' as const, quantity: parseInt(newKing) || 0 },
            ].filter(b => b.quantity > 0);

            await addDepartment({
                name: newName,
                address: newAddress,
                accessCode: newCode,
                bedrooms: parseInt(newBedrooms) || 0,
                bathrooms: parseInt(newBathrooms) || 0,
                beds: beds,
            });
            Alert.alert('Éxito', 'Departamento creado');
            setModalVisible(false);
            setNewName('');
            setNewAddress('');
            setNewCode('');
            setNewBedrooms('0');
            setNewBathrooms('0');
            setNewIndividual('0');
            setNewMatrimonial('0');
            setNewKing('0');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo crear el departamento');
        } finally {
            setCreating(false);
        }
    }

    const filteredDepts = departments.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.address && d.address.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <View className="flex-1 bg-slate-50 px-4 pt-4">
            {/* Search & Header */}
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold text-slate-800">Departamentos</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-orange-500 p-2 rounded-full">
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-white border border-slate-200 rounded-lg px-3 py-2 mb-4">
                <Search size={20} color="#94a3b8" />
                <TextInput
                    placeholder="Buscar..."
                    className="flex-1 ml-2 text-slate-700"
                    placeholderTextColor="#94a3b8"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <FlatList
                data={filteredDepts}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={dataLoading} onRefresh={refreshData} />}
                renderItem={({ item }) => (
                    // Convert DataContext EmployeeProfile[] to generic any[] if DepartmentCard expects specific shape, 
                    // or better, DepartmentCard should be slightly typed but safe to pass straight arrays.
                    // The DepartmentCard expects 'employees' to find assignee name. 
                    // The DataContext department object has `assignedTo` ID.
                    // Checking DepartmentCard props... usually accepts { department, employees }.
                    <DepartmentCard department={item} employees={employees} />
                )}
            />

            {/* Create Modal */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-800">Nuevo Departamento</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-slate-500 mb-2 font-bold">Nombre</Text>
                        <TextInput
                            value={newName}
                            onChangeText={setNewName}
                            className="bg-slate-100 p-4 rounded-lg mb-4 text-slate-800"
                            placeholder="Ej. Torre A - 101"
                        />

                        <Text className="text-slate-500 mb-2 font-bold">Dirección (Opcional)</Text>
                        <TextInput
                            value={newAddress}
                            onChangeText={setNewAddress}
                            className="bg-slate-100 p-4 rounded-lg mb-4 text-slate-800"
                            placeholder="Dirección completa"
                        />

                        <Text className="text-slate-500 mb-2 font-bold">Código de Acceso (Opcional)</Text>
                        <TextInput
                            value={newCode}
                            onChangeText={setNewCode}
                            className="bg-slate-100 p-4 rounded-lg mb-4 text-slate-800"
                            placeholder="Ej. 1234 o Caja fuerte"
                        />

                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1">
                                <Text className="text-slate-500 mb-2 font-bold">Habitaciones</Text>
                                <TextInput
                                    value={newBedrooms}
                                    onChangeText={setNewBedrooms}
                                    keyboardType="numeric"
                                    className="bg-slate-100 p-4 rounded-lg text-slate-800"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-500 mb-2 font-bold">Baños</Text>
                                <TextInput
                                    value={newBathrooms}
                                    onChangeText={setNewBathrooms}
                                    keyboardType="numeric"
                                    className="bg-slate-100 p-4 rounded-lg text-slate-800"
                                />
                            </View>
                        </View>

                        <View className="mb-6">
                            <Text className="text-slate-500 mb-3 font-bold">Configuración de Camas</Text>
                            <View className="flex-row gap-2">
                                <View className="flex-1">
                                    <Text className="text-[10px] uppercase text-slate-400 font-bold mb-1">Indiv.</Text>
                                    <TextInput
                                        value={newIndividual}
                                        onChangeText={setNewIndividual}
                                        keyboardType="numeric"
                                        className="bg-slate-100 p-3 rounded-lg text-slate-800 text-center"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[10px] uppercase text-slate-400 font-bold mb-1">Matrim.</Text>
                                    <TextInput
                                        value={newMatrimonial}
                                        onChangeText={setNewMatrimonial}
                                        keyboardType="numeric"
                                        className="bg-slate-100 p-3 rounded-lg text-slate-800 text-center"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[10px] uppercase text-slate-400 font-bold mb-1">King</Text>
                                    <TextInput
                                        value={newKing}
                                        onChangeText={setNewKing}
                                        keyboardType="numeric"
                                        className="bg-slate-100 p-3 rounded-lg text-slate-800 text-center"
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleCreate} disabled={creating} className={`bg-orange-500 p-4 rounded-xl items-center ${creating ? 'opacity-70' : ''}`}>
                            <Text className="text-white font-bold text-lg">{creating ? 'Creando...' : 'Crear Departamento'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
