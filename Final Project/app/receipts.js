import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Alert, KeyboardAvoidingView,
    Platform, TouchableOpacity, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { TextInput, Button, Provider as PaperProvider, DefaultTheme, ActivityIndicator } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import stations from '../app/stations.json';
import { useRouter } from 'expo-router';

export default function Receipts() {
    const router = useRouter();
    const [stationQuery, setStationQuery] = useState('');
    const [filteredStations, setFilteredStations] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [fuelType, setFuelType] = useState('Petrol');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [totalCost, setTotalCost] = useState('');
    const [date, setDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [receipts, setReceipts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadReceipts = async () => {
            try {
                const data = await AsyncStorage.getItem('fuel_receipts');
                if (data) {
                    setReceipts(JSON.parse(data));
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to load receipts');
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        loadReceipts();
    }, []);

    useEffect(() => {
        // Initialize with all stations when component mounts
        const allStations = stations.map((s) => s.name.replace(/[‘’]/g, "'"));
        setFilteredStations(allStations);
    }, []);

    const handleStationSearch = (text) => {
        setStationQuery(text);
        const filtered = stations
            .map((s) => s.name.replace(/[‘’]/g, "'"))
            .filter((name) => name.toLowerCase().includes(text.toLowerCase()));
        setFilteredStations(filtered);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
        if (!showDropdown) {
            // When opening dropdown, show all stations if search is empty
            if (!stationQuery) {
                const allStations = stations.map((s) => s.name.replace(/[‘’]/g, "'"));
                setFilteredStations(allStations);
            }
        }
    };

    const selectStation = (name) => {
        setStationQuery(name);
        setShowDropdown(false);
        Keyboard.dismiss();
    };

    const saveReceipt = async () => {
        if (!stationQuery?.trim() || !pricePerUnit || !totalCost || !date) {
            Alert.alert('Missing Fields', 'Please fill in all fields including date.');
            return;
        }

        try {
            const price = parseFloat(pricePerUnit);
            const total = parseFloat(totalCost);

            if (isNaN(price) || isNaN(total) || price <= 0 || total <= 0) {
                throw new Error('Please enter valid prices');
            }

            const litres = total / price;
            const cleanStation = stationQuery.replace(/[‘’]/g, "'");

            const newReceipt = {
                id: editingId ?? Date.now(),
                station: cleanStation,
                fuelType,
                pricePerUnit: price,
                totalCost: total,
                litres: parseFloat(litres.toFixed(2)),
                date: date.toISOString(),
            };

            const updated = editingId
                ? receipts.map(r => r.id === editingId ? newReceipt : r)
                : [newReceipt, ...receipts];

            setReceipts(updated);
            await AsyncStorage.setItem('fuel_receipts', JSON.stringify(updated));

            // Reset form
            setStationQuery('');
            setPricePerUnit('');
            setTotalCost('');
            setEditingId(null);
            setDate(null);
            setShowDropdown(false);

            Alert.alert('Success', editingId ? 'Entry updated!' : 'Entry saved!');
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save receipt');
            console.error(error);
        }
    };

    const deleteReceipt = async (id) => {
        Alert.alert(
            'Delete Receipt',
            'Are you sure you want to delete this receipt?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const filtered = receipts.filter(r => r.id !== id);
                        setReceipts(filtered);
                        await AsyncStorage.setItem('fuel_receipts', JSON.stringify(filtered));
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#785589" />
            </View>
        );
    }

    return (
        <PaperProvider theme={DefaultTheme}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Track Fuel / Charging</Text>
                    </View>

                    <View style={styles.body}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Station Name</Text>
                            <View style={styles.dropdownContainer}>
                                <TextInput
                                    value={stationQuery}
                                    onChangeText={handleStationSearch}
                                    onFocus={() => setShowDropdown(true)}
                                    mode="outlined"
                                    placeholder="Search or select station..."
                                    style={styles.input}
                                    right={
                                        <TextInput.Icon
                                            icon={showDropdown ? "chevron-up" : "chevron-down"}
                                            onPress={toggleDropdown}
                                        />
                                    }
                                />
                                {showDropdown && (
                                    <View style={styles.dropdown}>
                                        <FlatList
                                            data={filteredStations}
                                            keyExtractor={(item, index) => index.toString()}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={styles.dropdownItem}
                                                    onPress={() => selectStation(item)}
                                                >
                                                    <Text>{item}</Text>
                                                </TouchableOpacity>
                                            )}
                                            style={styles.dropdownList}
                                            keyboardShouldPersistTaps="handled"
                                            nestedScrollEnabled={true}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>

                        <Text style={styles.label}>Fuel Type:</Text>
                        <View style={styles.fuelRow}>
                            {['Petrol', 'Diesel', 'EV'].map(type => (
                                <Button
                                    key={type}
                                    mode={fuelType === type ? 'contained' : 'outlined'}
                                    onPress={() => setFuelType(type)}
                                    style={styles.fuelButton}
                                    labelStyle={{ color: fuelType === type ? '#fff' : '#785589' }}
                                >
                                    {type}
                                </Button>
                            ))}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                {fuelType === 'EV' ? 'Price per kWh (£)' : 'Price per litre (£)'}
                            </Text>
                            <TextInput
                                value={pricePerUnit}
                                onChangeText={setPricePerUnit}
                                keyboardType="decimal-pad"
                                mode="outlined"
                                style={styles.input}
                                placeholder="0.00"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Total Cost (£)</Text>
                            <TextInput
                                value={totalCost}
                                onChangeText={setTotalCost}
                                keyboardType="decimal-pad"
                                mode="outlined"
                                style={styles.input}
                                placeholder="0.00"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Date</Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <TextInput
                                    placeholder={fuelType === 'EV' ? 'Select charging date' : 'Select fueling date'}
                                    value={date ? date.toLocaleDateString() : ''}
                                    mode="outlined"
                                    editable={false}
                                    pointerEvents="none"
                                    style={styles.input}
                                    right={<TextInput.Icon icon="calendar" />}
                                />
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={date || new Date()}
                                mode="date"
                                display="default"
                                onChange={(e, selected) => {
                                    setShowDatePicker(false);
                                    if (selected) setDate(selected);
                                }}
                            />
                        )}

                        <Button
                            mode="contained"
                            onPress={saveReceipt}
                            style={styles.saveButton}
                            labelStyle={styles.buttonText}
                        >
                            {editingId ? 'Update Entry' : 'Save Entry'}
                        </Button>

                        <Button
                            mode="outlined"
                            onPress={() => router.push('/logs')}
                            style={styles.viewLogsButton}
                            labelStyle={{ color: '#785589' }}
                        >
                            View Spending Logs
                        </Button>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#DBC4A7',
    },
    container: {
        flex: 1,
        backgroundColor: '#DBC4A7',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#785589',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#DBC4A7',
        textAlign: 'center',
    },
    body: {
        flex: 1,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 16,
        position: 'relative',
    },
    label: {
        marginBottom: 8,
        fontWeight: '600',
        color: '#1A1A1A',
        fontSize: 14,
    },
    input: {
        backgroundColor: '#fff',
    },
    fuelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    fuelButton: {
        flex: 1,
        marginHorizontal: 4,
        borderColor: '#785589',
    },
    saveButton: {
        marginTop: 8,
        marginBottom: 12,
        backgroundColor: '#785589',
    },
    viewLogsButton: {
        borderColor: '#785589',
    },
    dropdownContainer: {
        position: 'relative',
        zIndex: 1,
    },
    dropdown: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        maxHeight: 200,
        elevation: 3,
        zIndex: 100,
    },
    dropdownList: {
        flex: 1,
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
});