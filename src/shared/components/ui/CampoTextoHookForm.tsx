import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { CampoTexto, PropsCampoTexto } from "./CampoTexto";

interface PropsCampoTextoHookForm<T extends FieldValues>
  extends Omit<PropsCampoTexto, "value" | "onChangeText" | "error" | "textoError"> {
  name: Path<T>;
  control: Control<T, any>;
  transformar?: (texto: string) => string;
}

export function CampoTextoHookForm<T extends FieldValues>({
  name,
  control,
  transformar,
  ...rest
}: PropsCampoTextoHookForm<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <CampoTexto
          value={value}
          onChangeText={(texto) => onChange(transformar ? transformar(texto) : texto)}
          error={!!error}
          textoError={error?.message}
          {...rest}
        />
      )}
    />
  );
}
