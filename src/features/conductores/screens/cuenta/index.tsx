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
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";

export default function CuentaConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
    const { perfil } = usePerfilConductor();

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
                            onPress={() => router.push("/(conductor)/cuenta/seguridad")}
                        />
                        <OpcionCuenta
                            icono="settings"
                            titulo="Configuración"
                            descripcion="Preferencias de la app"
                            onPress={() => router.push("/(conductor)/cuenta/configuracion")}
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
});
