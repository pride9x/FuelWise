import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Logs() {
    const router = useRouter();
    const [receipts, setReceipts] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        // Simulate a test receipt for March
        const testReceipt = [{
            id: 1,
            station: "Shell Bedford",
            fuelType: "Petrol",
            totalCost: 45.60,
            litres: 32.1,
            date: `${currentYear}-03-25T10:00:00Z`
        }];
        setReceipts(testReceipt);
    }, []);

    const filterReceiptsByMonth = (monthIndex) => {
        return receipts.filter((r) => {
            const d = new Date(r.date);
            return d.getMonth() === monthIndex && d.getFullYear() === currentYear;
        });
    };

    const calculateTotal = (entries) => {
        return entries.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2);
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Spending Logs ({currentYear})</Text>

            <Button onPress={() => router.back()} style={styles.backButton} mode="outlined">
                ← Go Back
            </Button>

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
                            monthlyReceipts.length > 0 ? (
                                monthlyReceipts.map((r) => (
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
                                ))
                            ) : (
                                <Text style={styles.entryText}>No entries for {month}</Text>
                            )
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
        backgroundColor: '#ffffff', // FORCE white background
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#007AFF',
        textAlign: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    monthBlock: {
        marginBottom: 20,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
        paddingBottom: 10,
    },
    monthHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 10,
    },
    entry: {
        backgroundColor: '#f1f1f1',
        padding: 10,
        borderRadius: 6,
        marginBottom: 8,
    },
    entryText: {
        fontSize: 14,
        color: '#333',
    },
});
