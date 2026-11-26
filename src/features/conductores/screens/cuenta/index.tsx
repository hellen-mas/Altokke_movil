import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { OpcionCuenta } from "@/features/conductores/components/OpcionCuenta";
import { TarjetaPerfilConductor } from "@/features/conductores/components/TarjetaPerfilConductor";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { useBilletera } from "@/features/finanzas/hooks/use-billetera";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  Text,
} from "react-native";

export default function CuentaConductor() {
    const { estilos: styles } = useTemaConductor(crearEstilos);
    const { perfil } = usePerfilConductor();

    const {
        saldo,
        cargando,
        error,
    } = useBilletera();

    const saldoTexto = error
        ? "Saldo no disponible"
        : cargando 
            ? "Consultando..."
            : `S/ ${saldo.toFixed(2)}`;

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                >
                    {/* Cabecera */}
                    <CabeceraConductor
                        titulo="Mi cuenta"
                        mostrarMarca
                    >
                        <TarjetaPerfilConductor
                            nombre={perfil.nombre}
                            calificacion={perfil.calificacion}
                            viajes={perfil.viajes}
                            estado={perfil.estado}
                            foto={perfil.foto}
                        />
                    </CabeceraConductor>

                    {/* Acceso a la billetera */}
                    <Pressable
                        style={styles.tarjetaBilletera}
                        onPress={() => 
                            router.push({
                                pathname: "/billetera",
                                params: { origen: "cuenta" },
                            })
                        }
                        accessibilityRole="button"
                        accessibilityLabel="Abrir mi billetera"
                    >
                        <View style={styles.filaBilletera}>
                            <View style={styles.iconoBilletera}>
                                <Ionicons
                                    name="wallet-outline"
                                    size={23}
                                    color="#FFFFFF"
                                />
                            </View>

                            <View style={styles.textosBilletera}>
                                <Text style={styles.tituloBilletera}>Mi billetera</Text>
                                <Text style={styles.descripcionBilletera}>Saldo disponible</Text>
                            </View>

                            <Ionicons
                                name="arrow-forward"
                                size={20}
                                color="#FFFFFF"
                            />
                        </View>

                        <Text style={styles.saldoBilletera}>{saldoTexto}</Text>
                        <Text style={styles.pieBilletera}>Administra tu dinero y recarga tu saldo</Text>
                    </Pressable>

                    {/* Opciones de cuenta */}
                    <View style={styles.opciones}>

                        <OpcionCuenta
                            icono="person"
                            titulo="Información personal"
                            descripcion="Tus datos, contacto y perfil"
                            onPress={() => router.push("/cuenta/informacion-personal")}
                        />
                        <OpcionCuenta
                            icono="car"
                            titulo="Vehículo"
                            descripcion="Información de tu mototaxi"
                            onPress={() => router.push("/cuenta/vehiculo")}
                        />
                        <OpcionCuenta
                            icono="document-text"
                            titulo="Documentos"
                            descripcion="Licencia, SOAT y otros documentos"
                            onPress={() => router.push("/cuenta/documentos")}
                        />
                        <OpcionCuenta
                            icono="time"
                            titulo="Historial"
                            descripcion="Tus viajes y actividades"
                            onPress={() => router.push("/cuenta/historial")}
                        />
                        <OpcionCuenta
                            icono="shield-checkmark"
                            titulo="Seguridad"
                            descripcion="Tu cuenta segura en todo momento"
                            onPress={() => router.push("/cuenta/seguridad")}
                        />
                        <OpcionCuenta
                            icono="settings"
                            titulo="Configuración"
                            descripcion="Preferencias de la app"
                            onPress={() => router.push("/cuenta/configuracion")}
                            ultimo
                        />
                    </View>
            </ScrollView>
        </View>
    );
}

const crearEstilos = (c: ColoresConductor) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.fondo,
    },

    scrollContent: {
        paddingBottom: 30,
    },

    opciones: {
        marginHorizontal: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: c.borde,
        borderRadius: 18,
        backgroundColor: c.superficie,
        overflow: "hidden",
    },

    tarjetaBilletera: {
        marginHorizontal: 20,
        marginTop: 16,
        padding: 19,
        borderRadius: 20,
        backgroundColor: c.headerA,
        borderWidth: 1,
        borderColor: c.headerB,
    },

    filaBilletera: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    iconoBilletera: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },

    textosBilletera: {
        flex: 1,
    },

    tituloBilletera: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },

    descripcionBilletera: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 12,
        marginTop: 3,
    },

    saldoBilletera: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
        marginTop: 17,
    },

    pieBilletera: {
        color: "rgba(255,255,255,0.78)",
        fontSize: 12,
        marginTop: 4,
    },

});
