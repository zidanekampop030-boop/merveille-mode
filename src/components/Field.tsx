import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { fonts, radius, useColors, useStyles, type Palette } from '../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export function Field({ label, error, hint, style, ...rest }: Props) {
  const colors = useColors();
  const s = useStyles(styles);
  const [focus, setFocus] = useState(false);
  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[s.input, focus && s.focus, !!error && s.err, style]}
        {...rest}
      />
      {error ? (
        <Text style={s.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={s.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = (colors: Palette) => StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.text },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
  },
  focus: { borderColor: colors.primary },
  err: { borderColor: colors.danger },
  error: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.danger },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
});
