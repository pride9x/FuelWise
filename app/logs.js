import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Button, SegmentedButtons } from 'react-native-paper';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'annual'
    const [stats, setStats] = useState({ totalSpent: 0, avgPerMonth: 0, fuelBreakdown: {} });

    useEffect(() => {
        const loadReceipts = async () => {
            const data = await AsyncStorage.getItem('fuel_receipts');
            if (data) {
                const parsed = JSON.parse(data);
                setReceipts(parsed);
                calculateStatistics(parsed);
            }
        };
        loadReceipts();
    }, []);

    useEffect(() => {
        calculateStatistics(receipts);
    }, [receipts, fuelFilter, selectedYear]);

    const calculateStatistics = (allReceipts) => {
        const filtered = applyFuelFilter(allReceipts.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === selectedYear;
        }));

        const totalSpent = filtered.reduce((sum, r) => sum + r.totalCost, 0);
        const monthsWithData = [...new Set(filtered.map(r => new Date(r.date).getMonth()))].length;
        const avgPerMonth = monthsWithData > 0 ? totalSpent / monthsWithData : 0;

        const fuelBreakdown = filtered.reduce((acc, r) => {
            acc[r.fuelType] = (acc[r.fuelType] || 0) + r.totalCost;
            return acc;
        }, {});

        setStats({
            totalSpent,
            avgPerMonth,
            fuelBreakdown
        });
    };

    const applyFuelFilter = (entries) => {
        return fuelFilter === 'All' ? entries : entries.filter(r => r.fuelType === fuelFilter);
    };

    const filterReceiptsByMonth = (monthIndex) => {
        return applyFuelFilter(receipts.filter((r) => {
            const d = new Date(r.date);
            return d.getMonth() === monthIndex && d.getFullYear() === selectedYear;
        }));
    };

    const getMonthlySpendingData = () => {
        return MONTHS.map((_, index) => {
            const monthReceipts = filterReceiptsByMonth(index);
            return monthReceipts.reduce((sum, r) => sum + r.totalCost, 0);
        });
    };

    const getFuelTypeData = () => {
        const data = [];
        const colors = {
            'Petrol': '#D60D13', // Red
            'Diesel': '#1A1A1A', // Black
            'EV': '#00cc66'      // Green
        };

        Object.entries(stats.fuelBreakdown).forEach(([type, amount]) => {
            if (amount > 0) {
                data.push({
                    name: type,
                    amount,
                    color: colors[type],
                    legendFontColor: '#1A1A1A',
                    legendFontSize: 12
                });
            }
        });

        return data;
    };

    const clearMonthReceipts = async (monthIndex) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        Alert.alert(
            'Clear Logs',
            `Are you sure you want to delete all ${fuelFilter === 'All' ? '' : fuelFilter + ' '}receipts for ${MONTHS[monthIndex]} ${selectedYear}?`,
            [
                { text: 'Cancel', style: 'cancel', onPress: () => Haptics.selectionAsync() },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        const filtered = receipts.filter((r) => {
                            const d = new Date(r.date);
                            if (fuelFilter === 'All') {
                                return !(d.getMonth() === monthIndex && d.getFullYear() === selectedYear);
                            } else {
                                return !(d.getMonth() === monthIndex &&
                                    d.getFullYear() === selectedYear &&
                                    r.fuelType === fuelFilter);
                            }
                        });
                        setReceipts(filtered);
                        await AsyncStorage.setItem('fuel_receipts', JSON.stringify(filtered));
                    }
                }
            ]
        );
    };

    const changeYear = (increment) => {
        Haptics.selectionAsync();
        setSelectedYear(prev => prev + increment);
        setSelectedMonth(null);
    };

    const chartConfig = {
        backgroundGradientFrom: "#DBC4A7",
        backgroundGradientTo: "#DBC4A7",
        decimalPlaces: 2,
        color: (opacity = 1) => `rgba(120, 85, 137, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
        style: { borderRadius: 16 },
        propsForLabels: {
            fontSize: 10
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Button
                    onPress={() => router.back()}
                    style={styles.backButton}
                    mode="outlined"
                    icon="arrow-left"
                >
                    Back
                </Button>
                <Text style={styles.title}>Spending Analytics</Text>
            </View>

            <View style={styles.yearSelector}>
                <TouchableOpacity onPress={() => changeYear(-1)}>
                    <MaterialIcons name="chevron-left" size={28} color="#785589" />
                </TouchableOpacity>
                <Text style={styles.yearText}>{selectedYear}</Text>
                <TouchableOpacity onPress={() => changeYear(1)}>
                    <MaterialIcons name="chevron-right" size={28} color="#785589" />
                </TouchableOpacity>
            </View>

            <SegmentedButtons
                value={viewMode}
                onValueChange={setViewMode}
                buttons={[
                    { value: 'monthly', label: 'Monthly View' },
                    { value: 'annual', label: 'Annual Summary' },
                ]}
                style={styles.segmentButtons}
            />

            <View style={styles.summaryCards}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Spent</Text>
                    <Text style={styles.summaryValue}>£{stats.totalSpent.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Avg/Month</Text>
                    <Text style={styles.summaryValue}>£{stats.avgPerMonth.toFixed(2)}</Text>
                </View>
            </View>

            {viewMode === 'annual' ? (
                <>
                    <Text style={styles.chartLabel}>Monthly Spending</Text>
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

                    {getFuelTypeData().length > 0 && (
                        <>
                            <Text style={styles.chartLabel}>Fuel Type Breakdown</Text>
                            <PieChart
                                data={getFuelTypeData()}
                                width={Dimensions.get("window").width - 32}
                                height={200}
                                chartConfig={chartConfig}
                                accessor="amount"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                style={styles.chart}
                                absolute
                            />
                        </>
                    )}
                </>
            ) : (
                <>
                    <Text style={styles.filterLabel}>Filter by fuel type:</Text>
                    <View style={styles.filterRow}>
                        {['All', 'Petrol', 'Diesel', 'EV'].map((type) => (
                            <Button
                                key={type}
                                mode={fuelFilter === type ? 'contained' : 'outlined'}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setFuelFilter(type);
                                }}
                                style={styles.filterButton}
                                buttonColor={fuelFilter === type ? '#785589' : undefined}
                                textColor={fuelFilter === type ? '#fff' : '#1A1A1A'}
                            >
                                {type}
                            </Button>
                        ))}
                    </View>

                    {MONTHS.map((month, index) => {
                        const monthlyReceipts = filterReceiptsByMonth(index);
                        const total = monthlyReceipts.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2);

                        return (
                            <View key={month} style={styles.monthBlock}>
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedMonth(selectedMonth === index ? null : index);
                                    }}
                                    style={styles.monthHeader}
                                >
                                    <View style={styles.monthHeaderRow}>
                                        <Text style={styles.monthHeaderText}>
                                            {month}: £{total}
                                        </Text>
                                        <MaterialIcons
                                            name={selectedMonth === index ? 'expand-less' : 'expand-more'}
                                            size={24}
                                            color="#785589"
                                        />
                                    </View>
                                </TouchableOpacity>

                                {selectedMonth === index && (
                                    <>
                                        {monthlyReceipts.length > 0 ? (
                                            <>
                                                {monthlyReceipts.map((r) => (
                                                    <View key={r.id} style={styles.entry}>
                                                        <View style={styles.entryHeader}>
                                                            <Text style={[styles.entryText, styles.entryStation]}>
                                                                {r.station}
                                                            </Text>
                                                            <View style={[
                                                                styles.fuelTypeBadge,
                                                                {
                                                                    backgroundColor:
                                                                        r.fuelType === 'Petrol' ? '#D60D13' :
                                                                            r.fuelType === 'Diesel' ? '#1A1A1A' : '#00cc66'
                                                                }
                                                            ]}>
                                                                <Text style={styles.fuelTypeText}>{r.fuelType}</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={styles.entryText}>
                                                            £{r.totalCost.toFixed(2)} • {r.litres} {r.fuelType === 'EV' ? 'kWh' : 'L'} • £{r.pricePerUnit.toFixed(2)}/{r.fuelType === 'EV' ? 'kWh' : 'L'}
                                                        </Text>
                                                        <Text style={[styles.entryText, styles.entryDate]}>
                                                            {new Date(r.date).toLocaleDateString('en-GB', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </Text>
                                                    </View>
                                                ))}
                                                <Button
                                                    onPress={() => clearMonthReceipts(index)}
                                                    style={styles.clearButton}
                                                    mode="contained"
                                                    buttonColor="#D60D13"
                                                    textColor="#fff"
                                                    icon="delete"
                                                >
                                                    Clear {month} Logs
                                                </Button>
                                            </>
                                        ) : (
                                            <Text style={styles.emptyText}>No entries for {month}</Text>
                                        )}
                                    </>
                                )}
                            </View>
                        );
                    })}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#DBC4A7',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        borderColor: '#1A1A1A',
        marginRight: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#785589',
        flex: 1,
        textAlign: 'center',
    },
    yearSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    yearText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginHorizontal: 15,
    },
    segmentButtons: {
        marginBottom: 20,
    },
    summaryCards: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        width: '48%',
        alignItems: 'center',
        elevation: 2,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#785589',
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
        marginBottom: 10,
        color: '#1A1A1A',
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    filterButton: {
        marginBottom: 10,
        minWidth: '23%',
    },
    monthBlock: {
        marginBottom: 20,
        borderBottomColor: '#888',
        borderBottomWidth: 1,
        paddingBottom: 10,
    },
    monthHeader: {
        marginBottom: 10,
    },
    monthHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    monthHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#785589',
    },
    entry: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 1,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    entryText: {
        fontSize: 14,
        color: '#1A1A1A',
    },
    entryStation: {
        fontWeight: '600',
        flex: 1,
    },
    entryDate: {
        color: '#666',
        marginTop: 5,
    },
    fuelTypeBadge: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 10,
        justifyContent: 'center',
    },
    fuelTypeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    clearButton: {
        marginTop: 10,
        borderRadius: 8,
    },
    emptyText: {
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 10,
    },
});