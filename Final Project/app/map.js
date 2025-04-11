import 'react-native-reanimated';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, Dimensions, ActivityIndicator,
    TouchableOpacity, Switch, TextInput, Alert, Platform,
    Keyboard, TouchableWithoutFeedback, Pressable
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import stations from '../app/stations.json';
import * as Linking from 'expo-linking';
import BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';



export default function MapScreen() {
    const [location, setLocation] = useState(null);
    const [showEV, setShowEV] = useState(false);
    const [fuelType, setFuelType] = useState('petrol');
    const [sortBy, setSortBy] = useState('distance');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStation, setSelectedStation] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const sheetRef = useRef(null);
    const snapPoints = useMemo(() => ['15%', '40%', '95%'], []);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setError('Location permission denied');
                    return;
                }
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc.coords);
            } catch (err) {
                setError('Failed to get location');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const openDirections = (lat, lon) => {
        setModalVisible(false);
        Alert.alert('Open with', 'Choose your navigation app:', [
            {
                text: 'Google Maps',
                onPress: () => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`),
            },
            {
                text: 'Waze',
                onPress: () => Linking.openURL(`https://waze.com/ul?ll=${lat},${lon}&navigate=yes`),
            },
            ...(Platform.OS === 'ios' ? [{
                text: 'Apple Maps',
                onPress: () => Linking.openURL(`http://maps.apple.com/?daddr=${lat},${lon}`),
            }] : []),
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const toRad = (value) => (value * Math.PI) / 180;
        const R = 3958.8; // miles
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(2);
    };

    const handleStationPress = (station) => {
        setSelectedStation(station);
        setModalVisible(true);
    };

    if (isLoading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#785589" />
                <Text>Getting your location...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.loaderContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.errorButton}
                    onPress={() => setLocation({ latitude: 51.7539, longitude: -0.3357 })}
                >
                    <Text style={{ color: '#fff' }}>Use Default Location</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const filteredStations = stations.filter((station) => {
        const isEV = station.plug_types !== undefined;
        const matchesSearch =
            station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            station.address?.toLowerCase().includes(searchQuery.toLowerCase());
        return (showEV ? isEV : !isEV) && matchesSearch;
    });

    const sortedStations = [...filteredStations].sort((a, b) => {
        const getLat = (s) => s.latitude || s.coordinates?.latitude;
        const getLon = (s) => s.longitude || s.coordinates?.longitude;

        const distA = parseFloat(calculateDistance(location.latitude, location.longitude, getLat(a), getLon(a)));
        const distB = parseFloat(calculateDistance(location.latitude, location.longitude, getLat(b), getLon(b)));

        if (sortBy === 'distance') return distA - distB;
        if (sortBy === 'price') {
            if (showEV) {
                const costA = parseFloat((a.cost_per_kWh || '').replace('£', '')) || Infinity;
                const costB = parseFloat((b.cost_per_kWh || '').replace('£', '')) || Infinity;
                return costA - costB;
            } else {
                const priceA = fuelType === 'petrol' ? a.petrol_price : a.diesel_price;
                const priceB = fuelType === 'petrol' ? b.petrol_price : b.diesel_price;
                return (priceA ?? Infinity) - (priceB ?? Infinity);
            }
        }
        return 0;
    });

    const renderItem = ({ item }) => {
        const lat = item.latitude || item.coordinates?.latitude;
        const lon = item.longitude || item.coordinates?.longitude;
        const isEV = item.plug_types !== undefined;
        const distance = calculateDistance(location.latitude, location.longitude, lat, lon);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleStationPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.detail}>{distance} mi away</Text>
                        <Text style={styles.detail}>{item.address}</Text>
                        {item.opening_hours && (
                            <Text style={[styles.detail, { color: '#785589' }]}>
                                {item.opening_hours === '24/7' ? 'Open 24/7' : `Hours: ${item.opening_hours}`}
                            </Text>
                        )}
                    </View>

                    <View style={styles.priceBlock}>
                        {isEV ? (
                            <Text style={[styles.priceText, { color: '#00cc66' }]}>
                                {item.cost_per_kWh}
                            </Text>
                        ) : (
                            <>
                                <Text style={[styles.priceText, { color: '#D60D13' }]}>
                                    Petrol: £{item.petrol_price?.toFixed(1)}
                                </Text>
                                <Text style={[styles.priceText, { color: '#1A1A1A' }]}>
                                    Diesel: £{item.diesel_price?.toFixed(1)}
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <MapView
                    style={StyleSheet.absoluteFill}
                    initialRegion={{
                        latitude: location?.latitude || 51.7539,
                        longitude: location?.longitude || -0.3357,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    }}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                >
                    {sortedStations.map((station) => {
                        const lat = station.latitude || station.coordinates?.latitude;
                        const lon = station.longitude || station.coordinates?.longitude;
                        const isEV = station.plug_types !== undefined;
                        const distance = calculateDistance(location.latitude, location.longitude, lat, lon);

                        return (
                            <Marker
                                key={station.id}
                                coordinate={{ latitude: lat, longitude: lon }}
                                pinColor={isEV ? '#00cc66' : '#D60D13'}
                                onPress={() => handleStationPress(station)}
                            >
                                <Callout onPress={() => handleStationPress(station)}>
                                    <View style={styles.calloutContainer}>
                                        <Text style={styles.calloutTitle}>{station.name}</Text>
                                        {isEV ? (
                                            <Text style={styles.calloutText}>
                                                {station.max_speed_kW}kW • {station.cost_per_kWh}
                                            </Text>
                                        ) : (
                                            <Text style={styles.calloutText}>
                                                Petrol: £{station.petrol_price?.toFixed(1)}
                                                {'\n'}Diesel: £{station.diesel_price?.toFixed(1)}
                                            </Text>
                                        )}
                                        {station.opening_hours && (
                                            <Text style={styles.calloutHours}>
                                                {station.opening_hours === '24/7' ? 'Open 24/7' : `Hours: ${station.opening_hours}`}
                                            </Text>
                                        )}
                                        <Text style={styles.calloutDistance}>{distance} mi away</Text>
                                    </View>
                                </Callout>
                            </Marker>
                        );
                    })}
                </MapView>

                <BottomSheet
                    ref={sheetRef}
                    index={1}
                    snapPoints={snapPoints}
                    enablePanDownToClose={false}
                    handleIndicatorStyle={{
                        backgroundColor: '#785589',
                        width: 40,
                        height: 5,
                    }}
                    handleStyle={{
                        backgroundColor: '#DBC4A7',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        paddingTop: 10,
                    }}
                    backgroundStyle={{
                        backgroundColor: '#DBC4A7',
                    }}
                >
                    <View style={styles.sheetContent}>
                        <View style={styles.filterRow}>
                            <Text style={styles.filterLabel}>{showEV ? 'EV Chargers' : 'Fuel Stations'}</Text>
                            <Switch
                                value={showEV}
                                onValueChange={() => setShowEV(!showEV)}
                                thumbColor={showEV ? '#785589' : '#f4f3f4'}
                                trackColor={{ false: '#767577', true: '#DBC4A7' }}
                            />
                        </View>

                        <TextInput
                            style={styles.search}
                            placeholder="Search by name or location..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <View style={styles.filterRow}>
                            <TouchableOpacity
                                style={[styles.filterButton, sortBy === 'distance' && styles.activeFilterButton]}
                                onPress={() => setSortBy('distance')}
                            >
                                <Text style={sortBy === 'distance' ? styles.activeFilterText : styles.filterText}>
                                    Sort by Distance
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterButton, sortBy === 'price' && styles.activeFilterButton]}
                                onPress={() => setSortBy('price')}
                            >
                                <Text style={sortBy === 'price' ? styles.activeFilterText : styles.filterText}>
                                    Sort by Price
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {!showEV && (
                            <View style={styles.filterRow}>
                                <TouchableOpacity
                                    style={[styles.filterButton, fuelType === 'petrol' && styles.activeFilterButton]}
                                    onPress={() => setFuelType('petrol')}
                                >
                                    <Text style={fuelType === 'petrol' ? styles.activeFilterText : styles.filterText}>
                                        Petrol
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.filterButton, fuelType === 'diesel' && styles.activeFilterButton]}
                                    onPress={() => setFuelType('diesel')}
                                >
                                    <Text style={fuelType === 'diesel' ? styles.activeFilterText : styles.filterText}>
                                        Diesel
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <BottomSheetFlatList
                            data={sortedStations}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </BottomSheet>

                <Modal
                    isVisible={modalVisible}
                    onBackdropPress={() => setModalVisible(false)}
                    onBackButtonPress={() => setModalVisible(false)}
                    style={styles.modal}
                    animationIn="slideInUp"
                    animationOut="slideOutDown"
                    backdropTransitionOutTiming={0}
                    hideModalContentWhileAnimating={true}
                    useNativeDriverForBackdrop={true}
                >
                    <View style={styles.modalContent}>
                        <Pressable
                            style={styles.modalCloseButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color="#785589" />
                        </Pressable>

                        {selectedStation && (
                            <>
                                <Text style={styles.modalTitle}>{selectedStation.name}</Text>
                                <Text style={styles.modalAddress}>{selectedStation.address}</Text>

                                {selectedStation.opening_hours && (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Opening Hours</Text>
                                        <Text style={styles.modalSectionText}>
                                            {selectedStation.opening_hours === '24/7'
                                                ? 'Open 24 hours, 7 days a week'
                                                : selectedStation.opening_hours}
                                        </Text>
                                    </View>
                                )}

                                {selectedStation.plug_types ? (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>EV Charging</Text>
                                        <Text style={styles.modalSectionText}>
                                            Plug Types: {selectedStation.plug_types.join(', ')}
                                            {'\n'}Max Speed: {selectedStation.max_speed_kW}kW
                                            {'\n'}Cost: {selectedStation.cost_per_kWh}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Fuel Prices</Text>
                                        <Text style={styles.modalSectionText}>
                                            Petrol: £{selectedStation.petrol_price?.toFixed(1)}
                                            {'\n'}Diesel: £{selectedStation.diesel_price?.toFixed(1)}
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.navigationButton}
                                    onPress={() => {
                                        const lat = selectedStation.latitude || selectedStation.coordinates?.latitude;
                                        const lon = selectedStation.longitude || selectedStation.coordinates?.longitude;
                                        openDirections(lat, lon);
                                    }}
                                >
                                    <Ionicons name="navigate" size={20} color="#fff" />
                                    <Text style={styles.navigationButtonText}>Get Directions</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </Modal>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#DBC4A7'
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#DBC4A7',
    },
    errorText: {
        fontSize: 16,
        color: '#D60D13',
        marginBottom: 20,
        textAlign: 'center',
    },
    errorButton: {
        backgroundColor: '#785589',
        marginTop: 10,
        padding: 10,
        borderRadius: 5,
    },
    sheetContent: {
        flex: 1,
        backgroundColor: '#DBC4A7',
        padding: 16,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    search: {
        backgroundColor: '#fff',
        color: '#000',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        fontSize: 14,
        marginBottom: 12,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    activeFilterButton: {
        backgroundColor: '#785589',
        borderColor: '#785589',
    },
    filterText: {
        color: '#1A1A1A',
    },
    activeFilterText: {
        color: '#fff',
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#785589',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    detail: {
        fontSize: 13,
        color: '#333',
        marginBottom: 2,
    },
    priceBlock: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 8,
    },
    priceText: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    calloutContainer: {
        width: 200,
        padding: 10,
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    calloutText: {
        fontSize: 12,
        marginBottom: 3,
    },
    calloutHours: {
        fontSize: 12,
        color: '#785589',
        marginBottom: 3,
    },
    calloutDistance: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    modal: {
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalCloseButton: {
        alignSelf: 'flex-end',
        padding: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 5,
    },
    modalAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    modalSection: {
        marginBottom: 15,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#785589',
        marginBottom: 5,
    },
    modalSectionText: {
        fontSize: 14,
        color: '#333',
    },
    navigationButton: {
        flexDirection: 'row',
        backgroundColor: '#785589',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    navigationButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});