import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CheapestScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Cheapest Fuel Screen (coming soon!)</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DBC4A7' },
    text: { color: '#1A1A1A', fontSize: 18, fontWeight: 'bold' },
});
