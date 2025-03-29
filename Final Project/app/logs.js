import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Logs() {
    const router = useRouter();
    const [receipts, setReceipts] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [fuelFilter, setFuelFilter] = useState('All');

    useEffect(() => {
        const loadReceipts = async () => {
            const data = await AsyncStorage.getItem('fuel_receipts');
            if (data) {
                const parsed = JSON.parse(data);
                setReceipts(parsed);
            }
        };
        loadReceipts();
    }, []);

    const applyFuelFilter = (entries) => {
        return fuelFilter === 'All' ? entries : entries.filter(r => r.fuelType === fuelFilter);
    };

    const filterReceiptsByMonth = (monthIndex) => {
        return applyFuelFilter(receipts.filter((r) => {
            const d = new Date(r.date);
            return d.getMonth() === monthIndex && d.getFullYear() === selectedYear;
        }));
    };

    const calculateTotal = (entries) => {
        return entries.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2);
    };

    const getMonthlySpendingData = () => {
        return MONTHS.map((_, index) => {
            const monthReceipts = filterReceiptsByMonth(index);
            return monthReceipts.reduce((sum, r) => sum + r.totalCost, 0);
        });
    };

    const clearMonthReceipts = async (monthIndex) => {
        Alert.alert(
            'Clear Logs',
            `Are you sure you want to delete all receipts for ${MONTHS[monthIndex]}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        const filtered = receipts.filter((r) => {
                            const d = new Date(r.date);
                            return !(d.getMonth() === monthIndex && d.getFullYear() === selectedYear);
                        });
                        setReceipts(filtered);
                        await AsyncStorage.setItem('fuel_receipts', JSON.stringify(filtered));
                    }
                }
            ]
        );
    };

    const chartConfig = {
        backgroundGradientFrom: "#DBC4A7",
        backgroundGradientTo: "#DBC4A7",
        decimalPlaces: 2,
        color: (opacity = 1) => `rgba(120, 85, 137, ${opacity})`, // purple
        labelColor: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
        style: { borderRadius: 16 },
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Spending Logs ({selectedYear})</Text>
            <Button onPress={() => router.back()} style={styles.backButton} mode="outlined">
                ← Go Back
            </Button>

            <Text style={styles.filterLabel}>Filter by fuel type:</Text>
            <View style={styles.filterRow}>
                {['All', 'Petrol', 'Diesel', 'EV'].map((type) => (
                    <Button
                        key={type}
                        mode={fuelFilter === type ? 'contained' : 'outlined'}
                        onPress={() => setFuelFilter(type)}
                        style={styles.filterButton}
                        buttonColor={fuelFilter === type ? '#785589' : undefined}
                        textColor={fuelFilter === type ? '#fff' : '#1A1A1A'}
                    >
                        {type}
                    </Button>
                ))}
            </View>

            <Text style={styles.chartLabel}>Monthly Spend (£)</Text>
            <BarChart
                data={{
                    labels: MONTHS.map(m => m.slice(0, 3)),
                    datasets: [{ data: getMonthlySpendingData() }]
                }}
                width={Dimensions.get("window").width - 32}
                height={220}
                yAxisLabel="£"
                chartConfig={chartConfig}
                verticalLabelRotation={30}
                style={styles.chart}
            />

            {MONTHS.map((month, index) => {
                const monthlyReceipts = filterReceiptsByMonth(index);
                const total = calculateTotal(monthlyReceipts);

                return (
                    <View key={month} style={styles.monthBlock}>
                        <TouchableOpacity onPress={() => setSelectedMonth(selectedMonth === index ? null : index)}>
                            <Text style={styles.monthHeader}>
                                {month}: £{total}
                            </Text>
                        </TouchableOpacity>

                        {selectedMonth === index && (
                            <>
                                {monthlyReceipts.length > 0 ? (
                                    <>
                                        {monthlyReceipts.map((r) => (
                                            <View key={r.id} style={styles.entry}>
                                                <Text style={styles.entryText}>
                                                    {r.station} • {r.fuelType}
                                                </Text>
                                                <Text style={styles.entryText}>
                                                    £{r.totalCost.toFixed(2)} for {r.litres} {r.fuelType === 'EV' ? 'kWh' : 'L'}
                                                </Text>
                                                <Text style={styles.entryText}>
                                                    {new Date(r.date).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        ))}
                                        <Button
                                            onPress={() => clearMonthReceipts(index)}
                                            style={styles.clearButton}
                                            mode="contained"
                                            buttonColor="#D60D13"
                                            textColor="#fff"
                                        >
                                            Clear {month} Logs
                                        </Button>
                                    </>
                                ) : (
                                    <Text style={styles.entryText}>No entries for {month}</Text>
                                )}
                            </>
                        )}
                    </View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#DBC4A7',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#785589',
        textAlign: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginBottom: 20,
        alignSelf: 'flex-start',
        borderColor: '#1A1A1A',
    },
    chartLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#1A1A1A',
    },
    chart: {
        borderRadius: 12,
        marginBottom: 30,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
        color: '#1A1A1A',
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    filterButton: {
        flex: 1,
        marginHorizontal: 4,
    },
    monthBlock: {
        marginBottom: 20,
        borderBottomColor: '#888',
        borderBottomWidth: 1,
        paddingBottom: 10,
    },
    monthHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#785589',
        marginBottom: 10,
    },
    entry: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 6,
        marginBottom: 8,
    },
    entryText: {
        fontSize: 14,
        color: '#1A1A1A',
    },
    clearButton: {
        marginTop: 10,
        borderRadius: 8,
    },
});
