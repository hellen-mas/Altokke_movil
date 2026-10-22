import { Stack } from "expo-router";
import { RegistroConductorProvider } from "@/features/conductores/context/RegistroConductorContext";

export default function RegistroConductorLayout() {
    return (
        <RegistroConductorProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            />
        </RegistroConductorProvider>
    );
}
