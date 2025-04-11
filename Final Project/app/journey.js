import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableWithoutFeedback,
    Keyboard, FlatList, TouchableOpacity, ScrollView, Modal, Dimensions
} from 'react-native';
import { Button, Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import carData from '../app/carData.json';

const RECENT_CARS_KEY = '@recentCars';
const POUND_SIGN = '\u00A3'; // £ symbol
const { height } = Dimensions.get('window');

// Ensure all cars have IDs
const validatedCarData = carData.map((car, index) => ({
    ...car,
    id: car.id || `car-${index}`
}));

export default function JourneyCalculator() {
    const [selectedCar, setSelectedCar] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCars, setFilteredCars] = useState(validatedCarData);
    const [recentCars, setRecentCars] = useState([]);
    const [distance, setDistance] = useState('');
    const [fuelCost, setFuelCost] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [drivingType, setDrivingType] = useState('Mixed');
    const [showCarModal, setShowCarModal] = useState(false);

    useEffect(() => {
        const filtered = validatedCarData.filter(car =>
            `${car.make} ${car.model}`.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCars(filtered);
    }, [searchQuery]);

    useEffect(() => {
        const loadRecents = async () => {
            try {
                const data = await AsyncStorage.getItem(RECENT_CARS_KEY);
                const cars = data ? JSON.parse(data) : [];
                setRecentCars(cars.map(car => ({
                    ...car,
                    id: car.id || `recent-${Date.now()}`
                })));
            } catch (error) {
                console.error('Error loading recent cars:', error);
            }
        };
        loadRecents();
    }, []);

    const getSuggestedFuelCost = (fuelType) => {
        switch (fuelType) {
            case 'Petrol': return '1.43';
            case 'Diesel': return '1.50';
            case 'Electric': return '0.79';
            default: return '';
        }
    };

    const saveRecentCar = async (car) => {
        try {
            const carToSave = {
                ...car,
                id: car.id || `recent-${Date.now()}`
            };
            const updatedRecents = [
                carToSave,
                ...recentCars.filter(c => c.id !== carToSave.id)
            ].slice(0, 5);

            await AsyncStorage.setItem(RECENT_CARS_KEY, JSON.stringify(updatedRecents));
            setRecentCars(updatedRecents);
        } catch (error) {
            console.error('Error saving recent car:', error);
        }
    };

    const selectCar = (car) => {
        Haptics.selectionAsync();
        setSelectedCar(car);
        setSearchQuery(`${car.make} ${car.model}`);
        setFuelCost(getSuggestedFuelCost(car.fuelType));
        setShowCarModal(false);
    };

    const calculateCost = () => {
        if (!selectedCar || !distance || !fuelCost) {
            setResult('Please fill in all fields.');
            return;
        }

        const dist = parseFloat(distance);
        const cost = parseFloat(fuelCost.replace('£', '').trim());

        if (isNaN(dist) || isNaN(cost) || dist <= 0 || cost <= 0) {
            setResult('Please enter valid numbers');
            return;
        }

        setIsLoading(true);

        try {
            const UK_GALLON = 4.54609;
            let adjustedMpg = selectedCar.mpg;
            let estimatedCost = 0;

            if (drivingType === 'Urban') adjustedMpg *= 0.85;
            else if (drivingType === 'Motorway') adjustedMpg *= 1.15;

            if (selectedCar.fuelType === 'Electric') {
                estimatedCost = (dist / selectedCar.milesPerKWh) * cost;
            } else {
                estimatedCost = ((dist / adjustedMpg) * UK_GALLON) * cost;
            }

            saveRecentCar(selectedCar);

            const fuelUsed = selectedCar.fuelType === 'Electric'
                ? (dist / selectedCar.milesPerKWh).toFixed(2)
                : ((dist / adjustedMpg) * UK_GALLON).toFixed(2);

            const breakdown = `
🚗 Vehicle: ${selectedCar.make} ${selectedCar.model} (${selectedCar.fuelType})
🛣️ Distance: ${dist.toFixed(2)} miles
⚙️ Driving Type: ${drivingType}
${selectedCar.fuelType === 'Electric' ? '⚡' : '⛽'} ${selectedCar.fuelType === 'Electric' ? 'Energy Used' : 'Fuel Used'}: ${fuelUsed} ${selectedCar.fuelType === 'Electric' ? 'kWh' : 'litres'}
💰 Cost per unit: ${POUND_SIGN}${cost.toFixed(2)}
🧮 Total Cost: ${POUND_SIGN}${estimatedCost.toFixed(2)}
            `;

            setResult(breakdown.trim());
        } catch (error) {
            setResult('Error calculating cost');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderCarItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.carItem,
                selectedCar?.id === item.id && styles.selectedCarItem
            ]}
            onPress={() => selectCar(item)}
        >
            <View style={styles.carTextContainer}>
                <Text style={styles.carTitle}>{item.make} {item.model}</Text>
                <Text style={styles.carDetails}>
                    {item.year} • {item.fuelType} • {item.fuelType === 'Electric' ?
                        `${item.milesPerKWh} mi/kWh` : `${item.mpg} mpg`}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <PaperProvider theme={DefaultTheme}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Journey Cost Calculator</Text>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.body}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Select Your Car:</Text>
                                <TouchableOpacity
                                    onPress={() => setShowCarModal(true)}
                                    style={styles.carInputContainer}
                                >
                                    <Text style={selectedCar ? styles.carInputText : styles.carInputPlaceholder}>
                                        {selectedCar ? `${selectedCar.make} ${selectedCar.model}` : 'Search car make/model...'}
                                    </Text>
                                    <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {selectedCar && (
                                <View style={styles.selectedCarContainer}>
                                    <Text style={styles.selectedCarText}>
                                        {selectedCar.make} {selectedCar.model} ({selectedCar.year})
                                    </Text>
                                    <Text style={styles.selectedCarDetail}>
                                        {selectedCar.fuelType} •
                                        {selectedCar.fuelType === 'Electric' ?
                                            ` ${selectedCar.milesPerKWh} mi/kWh` :
                                            ` ${selectedCar.mpg} mpg`}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Journey Distance (miles):</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="decimal-pad"
                                    value={distance}
                                    onChangeText={setDistance}
                                    placeholder="e.g. 30"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Driving Type:</Text>
                                <View style={styles.toggleContainer}>
                                    {['Urban', 'Mixed', 'Motorway'].map(type => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[
                                                styles.toggleButton,
                                                drivingType === type && styles.selectedToggle
                                            ]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setDrivingType(type);
                                            }}
                                        >
                                            <Text style={[
                                                styles.toggleText,
                                                drivingType === type && styles.selectedToggleText
                                            ]}>
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {selectedCar?.fuelType === 'Electric'
                                        ? `Electricity Cost (per kWh ${POUND_SIGN}):`
                                        : `Fuel Cost (per litre ${POUND_SIGN}):`}
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="decimal-pad"
                                    value={fuelCost}
                                    onChangeText={setFuelCost}
                                    placeholder={`e.g. ${POUND_SIGN}1.55`}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <Button
                                mode="contained"
                                onPress={calculateCost}
                                style={styles.calculateButton}
                                loading={isLoading}
                                disabled={isLoading || !selectedCar}
                                labelStyle={styles.buttonLabel}
                            >
                                {isLoading ? 'Calculating...' : 'Calculate Cost'}
                            </Button>

                            {result && (
                                <View style={styles.resultContainer}>
                                    <Text style={styles.resultText}>
                                        {result.split('\n').map((line, i) => (
                                            <Text key={i}>
                                                {line}
                                                {'\n'}
                                            </Text>
                                        ))}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Car Selection Modal */}
                    <Modal
                        visible={showCarModal}
                        animationType="slide"
                        onRequestClose={() => setShowCarModal(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Your Car</Text>
                                <TouchableOpacity
                                    onPress={() => setShowCarModal(false)}
                                    style={styles.closeButton}
                                >
                                    <MaterialIcons name="close" size={24} color="#785589" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search car make/model..."
                                    placeholderTextColor="#999"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus={true}
                                />
                            </View>

                            {recentCars.length > 0 && (
                                <View style={styles.sectionContainer}>
                                    <Text style={styles.sectionLabel}>Recently Used</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.horizontalScrollContent}
                                    >
                                        {recentCars.map((item) => (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={[
                                                    styles.recentCarItem,
                                                    selectedCar?.id === item.id && styles.selectedRecentCar
                                                ]}
                                                onPress={() => selectCar(item)}
                                            >
                                                <Text style={styles.recentCarTitle} numberOfLines={1}>
                                                    {item.make} {item.model}
                                                </Text>
                                                <Text style={styles.recentCarDetail} numberOfLines={1}>
                                                    {item.fuelType} • {item.fuelType === 'Electric' ?
                                                        `${item.milesPerKWh} mi/kWh` :
                                                        `${item.mpg} mpg`}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <FlatList
                                data={filteredCars}
                                keyExtractor={(item) => item.id}
                                renderItem={renderCarItem}
                                keyboardShouldPersistTaps="always"
                                contentContainerStyle={styles.listContent}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>No cars found</Text>
                                }
                                style={styles.carList}
                            />
                        </View>
                    </Modal>
                </View>
            </TouchableWithoutFeedback>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#DBC4A7'
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 20
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',
        backgroundColor: '#785589',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#DBC4A7',
    },
    body: {
        flex: 1,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
        fontSize: 14,
    },
    carInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    carInputText: {
        flex: 1,
        color: '#1A1A1A',
    },
    carInputPlaceholder: {
        flex: 1,
        color: '#999',
    },
    selectedCarContainer: {
        backgroundColor: '#F0E6F6',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#785589',
    },
    selectedCarText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#1A1A1A',
    },
    selectedCarDetail: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    input: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    toggleButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        marginRight: 8,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    selectedToggle: {
        backgroundColor: '#785589',
        borderColor: '#785589',
    },
    toggleText: {
        color: '#1A1A1A',
        fontWeight: 'bold',
    },
    selectedToggleText: {
        color: '#fff',
    },
    calculateButton: {
        backgroundColor: '#785589',
        marginTop: 16,
        paddingVertical: 8,
    },
    buttonLabel: {
        color: '#fff',
        fontWeight: 'bold',
    },
    resultContainer: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#785589',
    },
    resultText: {
        fontSize: 16,
        color: '#1A1A1A',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#DBC4A7',
        paddingTop: 50,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        padding: 16,
    },
    searchInput: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    sectionContainer: {
        paddingHorizontal: 16,
    },
    sectionLabel: {
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
        fontSize: 16,
    },
    horizontalScrollContent: {
        paddingBottom: 10,
    },
    recentCarItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginRight: 8,
        width: 160,
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectedRecentCar: {
        borderColor: '#785589',
        backgroundColor: '#F0E6F6',
    },
    recentCarTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#1A1A1A',
    },
    recentCarDetail: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    carList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    listContent: {
        paddingBottom: 30,
    },
    carItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectedCarItem: {
        borderColor: '#785589',
        backgroundColor: '#F0E6F6',
    },
    carTextContainer: {
        flex: 1,
    },
    carTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#1A1A1A',
    },
    carDetails: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    emptyText: {
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    }
});