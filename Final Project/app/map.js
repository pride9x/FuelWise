import 'react-native-reanimated';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, Dimensions, ActivityIndicator,
    TouchableOpacity, Switch, TextInput, Alert, Platform,
    Keyboard, TouchableWithoutFeedback
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import stations from '../app/stations.json';
import * as Linking from 'expo-linking';
import BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

export default function MapScreen() {
    const [location, setLocation] = useState(null);
    const [showEV, setShowEV] = useState(false);
    const [fuelType, setFuelType] = useState('petrol');
    const [sortBy, setSortBy] = useState('distance');
    const [searchQuery, setSearchQuery] = useState('');

    const sheetRef = useRef(null);
    const snapPoints = useMemo(() => ['15%', '40%', '95%'], []);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Location permission denied');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc.coords);
        })();
    }, []);

    const openDirections = (lat, lon) => {
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

    if (!location) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#785589" />
                <Text>Getting your location...</Text>
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
            <TouchableOpacity style={styles.card} onPress={() => openDirections(lat, lon)}>
                <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.detail}>{distance} mi away</Text>
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
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    }}
                    showsUserLocation={true}
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
                                title={station.name}
                                description={
                                    isEV
                                        ? `EV • ${station.max_speed_kW}kW • ${station.cost_per_kWh} • ${distance} mi`
                                        : `Petrol: £${station.petrol_price?.toFixed(1)} • Diesel: £${station.diesel_price?.toFixed(1)} • ${distance} mi`
                                }
                                onCalloutPress={() => openDirections(lat, lon)}
                            />
                        );
                    })}
                </MapView>

                <BottomSheet
                    ref={sheetRef}
                    index={1}
                    snapPoints={snapPoints}
                    enablePanDownToClose={false}
                    handleIndicatorStyle={{ backgroundColor: '#BFA88A' }}
                    handleStyle={{ backgroundColor: '#DBC4A7' }}
                    backgroundStyle={{ backgroundColor: '#DBC4A7' }}
                >

                    <View style={styles.sheetContent}>
                        <View style={styles.row}>
                            <Text style={styles.label}>{showEV ? 'EV Chargers' : 'Fuel Stations'}</Text>
                            <Switch value={showEV} onValueChange={() => setShowEV(!showEV)} />
                        </View>

                        <TextInput
                            style={styles.search}
                            placeholder="Search by name or location..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[styles.button, sortBy === 'distance' && styles.activeButton]}
                                onPress={() => setSortBy('distance')}
                            >
                                <Text>Sort by Distance</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, sortBy === 'price' && styles.activeButton]}
                                onPress={() => setSortBy('price')}
                            >
                                <Text>Sort by Price</Text>
                            </TouchableOpacity>
                        </View>

                        {!showEV && (
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.button, fuelType === 'petrol' && styles.activeButton]}
                                    onPress={() => setFuelType('petrol')}
                                >
                                    <Text>Petrol</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, fuelType === 'diesel' && styles.activeButton]}
                                    onPress={() => setFuelType('diesel')}
                                >
                                    <Text>Diesel</Text>
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
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#DBC4A7' },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#DBC4A7',
    },
    sheetContent: {
        flex: 1,
        backgroundColor: '#DBC4A7',
        padding: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    search: {
        backgroundColor: '#fff',
        color: '#000',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        fontSize: 14,
        marginBottom: 8,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: '#ddd',
        borderRadius: 8,
        marginRight: 6,
    },
    activeButton: {
        backgroundColor: '#785589',
    },
    card: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 5,
    },
    detail: {
        fontSize: 13,
        color: '#333',
        marginBottom: 2,
    },
    priceBlock: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    priceText: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 2,
    },
});
