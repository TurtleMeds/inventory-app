import { View, Text, TouchableOpacity, useColorScheme} from "react-native";
import { Picker } from "@react-native-picker/picker";
import TextInput from './TextInput'
import {
  getStyles,
} from "@/app/lib";
import { useState } from "react";

type SiteSettingsProps = {
  date: string,
  address: string,
  cityName: string;
  searchType: string;
  onChange: (key: string, value: string) => void,
}

const SiteSettings: React.FC<SiteSettingsProps> = ({ date, address, cityName, searchType, onChange }) => {

  const systemTheme = useColorScheme();
  const [darkMode, setDarkMode] = useState<boolean>(systemTheme === 'dark')
  const styles = getStyles(darkMode);

  const [expanded, setExpanded] = useState<boolean>(true);

  return (
    <View style={styles.formContainer}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text
          style={[styles.sectionTitle, {marginBottom: expanded ? 12 : 0}]}
        >
          {expanded ? "Site Settings ▲" : "Site Settings ▼"}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <View>
          <View style={styles.formGroup}>
            <TextInput
              title="Date"
              value={date}
              onChangeText={(date) => {onChange('date', date)}}
            />
            <TextInput
              title="Title (address)"
              value={address}
              onChangeText={(address) => {onChange('address', address)}}
            />
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, maxHeight: 150, overflow: 'visible'}}>
            <View style={styles.pickerContainer}>
              <Text style={[styles.label, {alignSelf: "center"}]}>City Code:</Text>
              <Picker
                style={styles.picker}
                mode='dropdown'
                prompt='City'
                selectedValue={cityName}
                onValueChange={(cityName: string) => {onChange('cityName', cityName)}}
              >
                <Picker.Item label="Seattle" value="Seattle"/>
                <Picker.Item label="Bellevue" value="Bellevue"/>
                <Picker.Item label="Kirkland" value="Kirkland"/>
                <Picker.Item label="Redmond" value="Redmond"/>
                <Picker.Item label="Sammamish" value="Sammamish"/>
              </Picker>
            </View>
            <View style={styles.pickerContainer}>
              <Text style={[styles.label, {alignSelf: "center"}]}>Search by:</Text>
              <Picker
                style={styles.picker}
                selectedValue={searchType}
                mode='dropdown'
                onValueChange={(searchType: string) => {onChange('searchType', searchType)}}
              >
                <Picker.Item label="Common Name" value="Common Name"/>
                <Picker.Item label="Tree Code" value="Tree Code"/>
                <Picker.Item label="Scientific Name" value="Scientific Name"/>
              </Picker>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default SiteSettings;
