import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, FlatList } from "react-native";
import { paletaColores } from "../../paletaColores";

export interface CustomSelectProps {
  placeholder: string;
  iconName: keyof typeof Ionicons.glyphMap;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}

export function CustomSelect({
  placeholder,
  iconName,
  value,
  options,
  onSelect,
}: CustomSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Pressable style={styles.container} onPress={() => setModalVisible(true)}>
        <Ionicons name={iconName} size={21} color={paletaColores.textoSecundario} />
        <Text style={[styles.text, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={21} color={paletaColores.textoSecundario} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={paletaColores.texto} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, value === item && styles.optionTextSelected]}>
                    {item}
                  </Text>
                  {value === item && (
                    <Ionicons name="checkmark" size={20} color={paletaColores.boton} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 14,
    backgroundColor: paletaColores.input,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: paletaColores.texto,
  },
  placeholderText: {
    color: paletaColores.textoSecundario,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: paletaColores.fondo,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "50%",
    borderWidth: 1,
    borderColor: paletaColores.borde,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: paletaColores.texto,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: paletaColores.borde,
  },
  optionText: {
    fontSize: 16,
    color: paletaColores.texto,
  },
  optionTextSelected: {
    color: paletaColores.verde,
    fontWeight: "bold",
  },
});
