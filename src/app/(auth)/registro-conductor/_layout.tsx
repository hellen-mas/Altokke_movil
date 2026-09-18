import { Stack } from "expo-router";
import { RegistroConductorProvider } from "@/context/RegistroConductorContext";

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