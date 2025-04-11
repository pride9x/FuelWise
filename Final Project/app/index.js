import 'react-native-reanimated';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

export default function HomeScreen() {
    const router = useRouter();

    return (
        <LinearGradient
            colors={['#785589', '#DBC4A7']}
            style={styles.gradient}
        >
            <View style={styles.container}>
                <Animatable.Image
                    animation="fadeInDown"
                    duration={1200}
                    source={require('../assets/logo.png')}
                    style={styles.logo}
                />

                <Animatable.Text
                    animation="fadeInUp"
                    duration={1400}
                    style={styles.title}
                >
                    FuelWise
                </Animatable.Text>

                <Animatable.Text
                    animation="fadeInUp"
                    delay={200}
                    style={styles.subtitle}
                >
                    Find the best fuel or EV charging deals, track your costs, and stay in control of your driving spend — all in one place.
                </Animatable.Text>

                <Animatable.View animation="fadeInUp" delay={400} style={styles.buttonWrapper}>
                    <TouchableOpacity style={styles.button} onPress={() => router.push('/map')}>
                        <Text style={styles.buttonText}>Find Cheapest Fuel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => router.push('/receipts')}>
                        <Text style={styles.buttonText}>Track Fuel / Charging</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => router.push('/journey')}>
                        <Text style={styles.buttonText}>Journey Calculator</Text>
                    </TouchableOpacity>


                </Animatable.View>

                <Text style={styles.footer}>developed by Andrei Trifan</Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },

    logo: {
        width: 220,
        height: 220,
        resizeMode: 'contain',
        marginBottom: 30,
        borderRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        opacity: 0.9, // Adjust opacity to blend with the background
    },


    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
        marginBottom: 30,
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    buttonWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#D60D13',
        paddingVertical: 14,
        paddingHorizontal: 35,
        borderRadius: 12,
        elevation: 3,
        marginTop: 15,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        fontSize: 12,
        color: '#444',
        textAlign: 'center',
    },
});
