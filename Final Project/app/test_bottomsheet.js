import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function TestSheet() {
    const sheetRef = useRef(null);
    const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <Text style={styles.title}>Testing BottomSheet</Text>

                <BottomSheet ref={sheetRef} index={1} snapPoints={snapPoints}>
                    <View style={styles.sheetContent}>
                        <Text style={styles.sheetText}>✅ BottomSheet works!</Text>
                    </View>
                </BottomSheet>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#DBC4A7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#785589',
    },
    sheetContent: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    sheetText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
});
