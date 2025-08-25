import React from 'react';
import { Text, TextInput as Input, KeyboardTypeOptions, NativeSyntheticEvent, StyleProp, StyleSheet, TextInputEndEditingEventData, TextStyle, View } from 'react-native';

type TextInputProps = {
  title?: string | undefined;
  style?: StyleProp<TextStyle> | undefined;
  value?: string | undefined;
  onChangeText?: ((text: string) => void) | undefined;
  onEndEditing?:
    | ((e: NativeSyntheticEvent<TextInputEndEditingEventData>) => void)
    | undefined;
  keyboardType?: KeyboardTypeOptions | undefined;
  editable?: boolean | undefined;
  multiline?: boolean | undefined;
}

const TextInput: React.FC<TextInputProps> = ({title, style, value, onChangeText, onEndEditing, keyboardType, editable, multiline}) => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.label}>{title}: </Text>}
      <Input
        style={[style, styles.textInput]}
        value={value}
        onChangeText={onChangeText}
        onEndEditing={onEndEditing}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
    position: 'relative',
  },
  label: {
    marginTop: 10,
    position: 'absolute',
    top: -10, // floats above the border
    left: 12,
    backgroundColor: '#fff', // mask the border line behind label
    paddingHorizontal: 4,
    fontSize: 12,
    color: '#4b5563',
    zIndex: 500,
  },
  textInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#1f2937',
    width: '100%',
    textAlign: 'left',
    fontSize: 14,
  },
});

export default TextInput;
