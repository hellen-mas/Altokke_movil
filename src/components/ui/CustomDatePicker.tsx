import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";
import { paletaColores } from "../../paletaColores";

export interface CustomDatePickerProps {
  placeholder: string;
  iconName: keyof typeof Ionicons.glyphMap;
  date: Date | null;
  onSelect: (date: Date) => void;
}

export function CustomDatePicker({
  placeholder,
  iconName,
  date,
  onSelect,
}: CustomDatePickerProps) {
  const [show, setShow] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
       setShow(false);
    }
    if (selectedDate) {
      onSelect(selectedDate);
    }
  };

  const formattedDate = date
    ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
    : "";

  return (
    <>
      <Pressable style={styles.container} onPress={() => setShow(true)}>
        <Ionicons name={iconName} size={21} color={paletaColores.textoSecundario} />
        <Text style={[styles.text, !date && styles.placeholderText]}>
          {formattedDate || placeholder}
        </Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
          maximumDate={new Date()}
        />
      )}
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
});
