import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Alert, KeyboardAvoidingView,
    Platform, TouchableOpacity, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { TextInput, Button, Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import stations from '../app/stations.json';
import { useRouter } from 'expo-router';

export default function Receipts() {
    const router = useRouter();
    const [stationQuery, setStationQuery] = useState('');
    const [filteredStations, setFilteredStations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [fuelType, setFuelType] = useState('Petrol');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [totalCost, setTotalCost] = useState('');
    const [date, setDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [receipts, setReceipts] = useState([]);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        loadReceipts();
    }, []);

    const loadReceipts = async () => {
        const data = await AsyncStorage.getItem('fuel_receipts');
        if (data) {
            setReceipts(JSON.parse(data));
        }
    };

    const handleStationSearch = (text) => {
        setStationQuery(text);
        setShowSuggestions(true);
        const filtered = stations
            .map((s) => s.name.replace(/[‘’]/g, "'"))
            .filter((name) => name.toLowerCase().includes(text.toLowerCase()));
        setFilteredStations(filtered);
    };

    const selectStation = (name) => {
        setStationQuery(name);
        setShowSuggestions(false);
    };

    const saveReceipt = async () => {
        if (!stationQuery || !pricePerUnit || !totalCost || !date) {
            Alert.alert('Missing Fields', 'Please fill in all fields including date.');
            return;
        }

        const litres = parseFloat(totalCost) / parseFloat(pricePerUnit);
        const cleanStation = stationQuery.replace(/[‘’]/g, "'");

        const newReceipt = {
            id: editingId ?? Date.now(),
            station: cleanStation,
            fuelType,
            pricePerUnit: parseFloat(pricePerUnit),
            totalCost: parseFloat(totalCost),
            litres: parseFloat(litres.toFixed(2)),
            date: date.toISOString(),
        };

        const updated = editingId
            ? receipts.map(r => r.id === editingId ? newReceipt : r)
            : [newReceipt, ...receipts];

        setReceipts(updated);
        await AsyncStorage.setItem('fuel_receipts', JSON.stringify(updated));

        // Reset all fields
        setStationQuery('');
        setFuelType('Petrol');
        setPricePerUnit('');
        setTotalCost('');
        setEditingId(null);
        setDate(null);
        setShowSuggestions(false);

        // Show success message after save
        setTimeout(() => {
            Alert.alert('Success', editingId ? 'Entry updated successfully!' : 'Entry saved successfully!');
        }, 100);
    };

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
                        <View style={{ marginBottom: 12 }}>
                            <TextInput
                                label="Station Name"
                                value={stationQuery}
                                onChangeText={handleStationSearch}
                                mode="outlined"
                                placeholder="Start typing..."
                                style={styles.input}
                            />
                            {showSuggestions && filteredStations.length > 0 && (
                                <FlatList
                                    data={filteredStations}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.suggestionItem}
                                            onPress={() => selectStation(item)}
                                        >
                                            <Text>{item}</Text>
                                        </TouchableOpacity>
                                    )}
                                    style={styles.suggestionsList}
                                    keyboardShouldPersistTaps="handled"
                                />
                            )}
                        </View>

                        <Text style={styles.label}>Fuel Type:</Text>
                        <View style={styles.fuelRow}>
                            {['Petrol', 'Diesel', 'EV'].map(type => (
                                <Button
                                    key={type}
                                    mode={fuelType === type ? 'contained' : 'outlined'}
                                    onPress={() => setFuelType(type)}
                                    style={styles.fuelButton}
                                >
                                    {type}
                                </Button>
                            ))}
                        </View>

                        <TextInput
                            label={fuelType === 'EV' ? 'Price per kWh (\u00A3)' : 'Price per litre (\u00A3)'}
                            value={pricePerUnit}
                            onChangeText={setPricePerUnit}
                            keyboardType="decimal-pad"
                            mode="outlined"
                            style={styles.input}
                        />

                        <TextInput
                            label={"Total Cost (\u00A3)"}
                            value={totalCost}
                            onChangeText={setTotalCost}
                            keyboardType="decimal-pad"
                            mode="outlined"
                            style={styles.input}
                        />

                        <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.9}>
                            <TextInput
                                placeholder={fuelType === 'EV' ? 'Select date of charging' : 'Select date of fueling'}
                                value={date ? date.toDateString() : ''}
                                mode="outlined"
                                editable={false}
                                pointerEvents="none"
                                style={styles.input}
                                placeholderTextColor="#999"
                            />
                        </TouchableOpacity>

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

                        <Button mode="contained" onPress={saveReceipt} style={styles.saveButton}>
                            {editingId ? 'Update Entry' : 'Save Entry'}
                        </Button>

                        <Button mode="outlined" onPress={() => router.push('/logs')} style={styles.viewLogsButton}>
                            View Spending Logs
                        </Button>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
        backgroundColor: '#DBC4A7',
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    label: {
        marginBottom: 5,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    fuelRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginBottom: 15,
    },
    fuelButton: {
        flex: 1,
        marginHorizontal: 4,
    },
    saveButton: {
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: '#785589',
    },
    viewLogsButton: {
        borderColor: '#785589',
    },
    suggestionsList: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        maxHeight: 120,
        marginTop: -8,
        marginBottom: 8,
        borderRadius: 6,
        zIndex: 100,
    },
    suggestionItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
});
