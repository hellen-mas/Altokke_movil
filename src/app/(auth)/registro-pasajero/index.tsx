import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { PageHeader } from '@/components/ui/PageHeader';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { CustomInput } from '@/components/ui/CustomInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AuthFooter } from '@/components/ui/AuthFooter';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { paletaColores } from '@/paletaColores';

export default function PasajeroDatosPersonalesScreen() {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [genero, setGenero] = useState('');
  const [direccion, setDireccion] = useState('');
  const [correo, setCorreo] = useState('');

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={paletaColores.texto} />
          </Pressable>
          <Text style={styles.headerTitle}>Altokke</Text>
          <View style={{ width: 24 }} />
        </View>

        <PageHeader 
          title="Crea tu cuenta " 
          highlightedTitle="de pasajero" 
          description="Completa tus datos básicos para continuar." 
        />

        <View style={styles.stepContainer}>
          <Text style={styles.stepText}>Paso 1 de 3</Text>
          <View style={styles.stepIndicatorWrapper}>
            <StepIndicator currentStep={1} totalSteps={3} />
          </View>
        </View>

        <View style={styles.profileSection}>
          <Pressable style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color={paletaColores.textoSecundario} />
            </View>
            <View style={styles.addIconContainer}>
              <Ionicons name="add" size={16} color={paletaColores.fondo} />
            </View>
          </Pressable>
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileTitle}>
              Foto de perfil <Text style={styles.optionalText}>(opcional)</Text>
            </Text>
            <Text style={styles.profileDescription}>
              Agrega una foto para que te reconozcan más fácil.
            </Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <CustomInput 
            iconName="person-outline" 
            placeholder="Nombres" 
            value={nombres}
            onChangeText={setNombres}
          />
          <CustomInput 
            iconName="person-outline" 
            placeholder="Apellidos" 
            value={apellidos}
            onChangeText={setApellidos}
          />
          <CustomSelect 
            iconName="card-outline" 
            placeholder="Tipo de documento" 
            value={tipoDocumento}
            options={["DNI", "Pasaporte", "Carnet de Extranjería"]}
            onSelect={setTipoDocumento}
          />
          <CustomInput 
            iconName="card-outline" 
            placeholder="Número de documento" 
            value={numeroDocumento}
            onChangeText={setNumeroDocumento}
            keyboardType="numeric"
          />
          <CustomDatePicker
            iconName="calendar-outline"
            placeholder="Fecha de nacimiento"
            date={fechaNacimiento}
            onSelect={setFechaNacimiento}
          />
          <CustomSelect 
            iconName="male-female-outline" 
            placeholder="Género" 
            value={genero}
            options={["Masculino", "Femenino", "Otro", "Prefiero no decirlo"]}
            onSelect={setGenero}
          />
          <CustomInput 
            iconName="location-outline" 
            placeholder="Dirección" 
            value={direccion}
            onChangeText={setDireccion}
          />
          <CustomInput 
            iconName="mail-outline" 
            placeholder="Correo electrónico" 
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton 
            title="Siguiente" 
            onPress={() => router.push("/registro-pasajero/verificacion" as any)} 
          />
        </View>

        <AuthFooter 
          questionText="¿Ya tienes cuenta?" 
          linkText="Iniciar sesión" 
          href={"/login" as any} 
          showBorder={false}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    flexGrow: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: paletaColores.texto,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: paletaColores.texto,
    marginRight: 16,
  },
  stepIndicatorWrapper: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: paletaColores.input,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: paletaColores.verde,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: paletaColores.fondo,
  },
  profileTextContainer: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: paletaColores.texto,
    marginBottom: 4,
  },
  optionalText: {
    fontSize: 14,
    fontWeight: '400',
    color: paletaColores.textoSecundario,
  },
  profileDescription: {
    fontSize: 14,
    color: paletaColores.textoSecundario,
    lineHeight: 20,
  },
  formContainer: {
    gap: 16,
    marginBottom: 30,
  },
  buttonContainer: {
    marginBottom: 20,
  },
});
