import React, { useState } from 'react';
import {
  Text,
  TextInput as Input,
  StyleProp,
  TextStyle,
  View,
  useColorScheme,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { getStyles } from "../app/lib";

// Extend RN's props so we don't lose anything
type CustomTextInputProps = {
  title?: string;
  style?: StyleProp<TextStyle>;
} & RNTextInputProps;

const TextInput: React.FC<CustomTextInputProps> = ({ title, style, ...props }) => {
  const systemTheme = useColorScheme();
  const [darkMode] = useState<boolean>(systemTheme === 'dark');
  const styles = getStyles(darkMode);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.label}>{title}: </Text>}
      <Input
        style={[styles.textInput, style]}
        {...props} // 👈 forward EVERYTHING else (multiline, onFocus, returnKeyType, etc.)
      />
    </View>
  );
};

export default TextInput;
