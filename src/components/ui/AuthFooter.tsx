import { Href, Link } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { paletaColores } from "../../paletaColores";

interface Props {
  questionText: string;
  linkText: string;
  href: Href;
  align?: "left" | "center" | "right";
  showBorder?: boolean;
}

export const AuthFooter = ({
  questionText,
  linkText,
  href,
  align = "center",
  showBorder = true,
}: Props) => {
  return (
    <Text
      style={[
        styles.accesoCuenta,
        { textAlign: align },
        !showBorder && { borderWidth: 0 },
      ]}
    >
      {questionText}{" "}
      <Link href={href} style={styles.enlaceAcceso}>
        {linkText}
      </Link>
    </Text>
  );
};

const styles = StyleSheet.create({
  accesoCuenta: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 13,
    paddingHorizontal: 20,
    fontSize: 14,
    lineHeight: 20,
    color: paletaColores.texto,
  },

  enlaceAcceso: {
    color: paletaColores.verde,
    fontWeight: "600",
  },
});
