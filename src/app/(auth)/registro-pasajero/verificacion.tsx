import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { paletaColores } from '@/paletaColores';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { CustomInput } from '@/components/ui/CustomInput';

export default function PasajeroVerificacionScreen() {
  const [selectedPayment, setSelectedPayment] = useState('Efectivo');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={paletaColores.texto} />
        </Pressable>
        <Text style={styles.topBarTitle}>Altokke</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        <View style={styles.stepContainer}>
          <StepIndicator currentStep={2} totalSteps={3} />
          <Text style={styles.stepText}>Paso 2 de 3</Text>
        </View>

        <View style={styles.headerContainer}>
          <PageHeader 
            title="Verificación y contacto" 
            highlightedTitle="" 
            description="Confirma tu identidad y cómo te contactaremos." 
          />
        </View>

        <View style={styles.card}>
          <Ionicons name="call-outline" size={24} color={paletaColores.texto} style={styles.cardIcon} />
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Número de teléfono</Text>
            <Text style={styles.cardValue}>+51 987 654 321</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={paletaColores.boton} />
            <Text style={styles.verifiedText}>Verificado</Text>
          </View>
        </View>

        <Pressable style={styles.card}>
          <Ionicons name="location-outline" size={24} color={paletaColores.texto} style={styles.cardIcon} />
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Dirección principal</Text>
            <Text style={styles.cardValue}>Av. Los Próceres 123</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={paletaColores.textoSecundario} />
        </Pressable>

        <Pressable style={styles.card}>
          <Ionicons name="business-outline" size={24} color={paletaColores.texto} style={styles.cardIcon} />
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Ciudad</Text>
            <Text style={styles.cardValue}>Bagua</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={paletaColores.textoSecundario} />
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={24} color={paletaColores.texto} style={styles.sectionIcon} />
            <View>
              <Text style={styles.sectionTitle}>Método de pago preferido</Text>
              <Text style={styles.sectionSubtitle}>Selecciona cómo prefieres pagar tus viajes.</Text>
            </View>
          </View>

          <View style={styles.paymentMethodsRow}>
            {['Efectivo', 'Yape', 'Plin'].map((method) => {
              const isSelected = selectedPayment === method;
              return (
                <Pressable
                  key={method}
                  style={[styles.paymentCard, isSelected && styles.paymentCardSelected]}
                  onPress={() => setSelectedPayment(method)}
                >
                  <View style={styles.paymentCardTopRow}>
                    <View style={styles.paymentIconContainer}>
                      {method === 'Efectivo' ? (
                        <Ionicons name="cash-outline" size={28} color={isSelected ? paletaColores.texto : paletaColores.textoSecundario} />
                      ) : method === 'Yape' ? (
                        <View style={[styles.methodLogoPlaceholder, { backgroundColor: '#742183' }]}>
                          <Text style={styles.methodLogoText}>Y</Text>
                        </View>
                      ) : (
                        <View style={[styles.methodLogoPlaceholder, { backgroundColor: '#00D1FF' }]}>
                          <Text style={styles.methodLogoText}>P</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons 
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                      size={20} 
                      color={isSelected ? paletaColores.boton : paletaColores.borde} 
                    />
                  </View>
                  <Text style={[styles.paymentMethodName, isSelected && styles.paymentMethodNameSelected]}>{method}</Text>
                  <Text style={[styles.paymentMethodDesc, isSelected && styles.paymentMethodDescSelected]}>
                    {method === 'Efectivo' ? 'Pago en el viaje' : 'Pago al conductor'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={24} color={paletaColores.texto} style={styles.sectionIcon} />
            <View>
              <Text style={styles.sectionTitle}>Contacto de emergencia (opcional)</Text>
              <Text style={styles.sectionSubtitle}>En caso de cualquier eventualidad.</Text>
            </View>
          </View>

          <View style={styles.emergencyInputsRow}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <CustomInput
                iconName="person-outline"
                placeholder="Ej. María Pérez"
                value={emergencyName}
                onChangeText={setEmergencyName}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <CustomInput
                iconName="call-outline"
                placeholder="Ej. 987 654 321"
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton title="Siguiente" onPress={() => router.push("/registro-pasajero/preferencias" as any)} />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Atrás</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  topBarTitle: {
    color: paletaColores.texto,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  stepContainer: {
    alignItems: 'center',
    marginTop: -10,
  },
  stepText: {
    color: paletaColores.textoSecundario,
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
  },
  headerContainer: {
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: paletaColores.input,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardIcon: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    color: paletaColores.textoSecundario,
    fontSize: 12,
    marginBottom: 4,
  },
  cardValue: {
    color: paletaColores.texto,
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(53, 233, 130, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: paletaColores.boton,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 12,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    color: paletaColores.texto,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: paletaColores.textoSecundario,
    fontSize: 14,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: paletaColores.input,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  paymentCardSelected: {
    borderColor: paletaColores.boton,
    backgroundColor: 'rgba(53, 233, 130, 0.05)',
  },
  paymentCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  paymentIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodLogoText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  paymentMethodName: {
    color: paletaColores.texto,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentMethodNameSelected: {
    color: paletaColores.verde,
  },
  paymentMethodDesc: {
    color: paletaColores.textoSecundario,
    fontSize: 11,
  },
  paymentMethodDescSelected: {
    color: paletaColores.boton,
  },
  emergencyInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    color: paletaColores.textoSecundario,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  footer: {
    marginTop: 32,
    gap: 16,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: paletaColores.texto,
    fontSize: 16,
    fontWeight: '600',
  },
});
