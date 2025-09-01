import { Alert, StyleSheet, TouchableOpacity, View, Text, Platform } from 'react-native';
import treeList from '../assets/data/treeList.json'
import SeattleAllowList from '../assets/data/directorsRule.json';

export interface NewTreeForm {
  treeType: 'Onsite' | 'Adjacent' | 'ROW';
  search: string;
  commonName: string;
  species: string;
  dsh: string;
  dlr: string;
  class: string | undefined;
  cond: string;
  tpz: string;
  itpz: string;
  retain: string;
  notes: string;
  isMultistem: boolean;
  stemDSHs: string[];
}

export interface Tree extends NewTreeForm {
  id: number;
}

export interface Inventory {
  id: number;
  trees: Tree[];
  searchType: string;
  cityName: string;
  date: string;
  siteNotes: string;
  newTree: NewTreeForm;
  address: string;
}

export interface InventoryID {
  id: number;
  address: string | undefined;
  latest: string;
}

export interface InventoryIndex {
  inventories: InventoryID[];
}

export type City = CityCode;

export interface CityCode {
  tpzFunction: ((dsh: number, dlr: number) => number);
  itpzFunction: ((dsh: number, dlr: number) => number);
  classFunction: ((dsh: number, commonName: string, scientificName: string, treeType: 'Onsite' | 'Adjacent' | 'ROW') => string | undefined)
  significanceFunction: ((dsh: number, commonName: string) => boolean);
  className: 'Tier' | 'Class';
}

export const Seattle: CityCode = {
  tpzFunction: (dsh, dlr) => (dsh + dlr) / 2,

  itpzFunction(dsh, dlr) {
    return this.tpzFunction(dsh, dlr) / 2;
  },

  classFunction(dsh, commonName, scientificName, treeType) {
    if (treeType == 'ROW') return 'ROW';

    for (const allowed of SeattleAllowList) {
      if (allowed.name.includes("sp.")) {
        const genus = allowed.name.split(" ")[0];
        if (allowed.name.includes("(")) {
          const speciesList = allowed.name.split("(")[1].replace(")", "").split(", ");
          for (const species of speciesList) {
            if (genus.concat(" ", species) === scientificName && allowed.dsh <= dsh) {
              return '2';
            }
          }
        } else if (genus === scientificName.split(" ")[0] && allowed.dsh <= dsh) {
          return '2';
        }
      } else if (allowed.name === scientificName && allowed.dsh <= dsh) {
        return '2';
      }
    }

    if (isNaN(dsh)) return '';

    if (dsh <= 12) return '4';

    const blocklist = ["Red alder", "Black cottonwood", "Lombardy poplar", "Bitter cherry"];
    if (dsh <= 24 || blocklist.includes(commonName)) return '3';

    if (dsh > 24) return '2';
    return '';
  },

  significanceFunction: (dsh, _commonName) => dsh >= 6,

  className: 'Tier'
};

export const Bellevue: CityCode = {
  tpzFunction: (dsh, dlr) => (dsh + dlr) / 2,

  itpzFunction(dsh, dlr) {
    return this.tpzFunction(dsh, dlr) / 2;
  },

  classFunction(dsh) {
    if (isNaN(dsh)) return '';
    if (dsh > 24) return 'Landmark';
    return '';
  },

  significanceFunction: (dsh) => dsh >= 8,

  className: 'Class'
};

export const Kirkland: CityCode = {
  tpzFunction: (dsh, dlr) => (dsh + dlr) / 2,

  itpzFunction(dsh, dlr) {
    return this.tpzFunction(dsh, dlr) / 2;
  },

  classFunction(dsh) {
    if (isNaN(dsh)) return '';
    if (dsh > 26) return 'Landmark';
    return '';
  },

  significanceFunction: (dsh) => dsh >= 6,

  className: 'Class'
};

export const Redmond: CityCode = {
  tpzFunction: (dsh, dlr) => (dsh + dlr) / 2,

  itpzFunction(dsh, dlr) {
    return this.tpzFunction(dsh, dlr) / 2;
  },

  classFunction(dsh) {
    if (isNaN(dsh)) return '';
    if (dsh > 26) return 'Landmark';
    return '';
  },

  significanceFunction(dsh) {
    if (dsh >= 6) return true;
    if (dsh >= 4) {
      Alert.alert(
        'Is this tree healthy?',
        'if not, this tree may not be significant.',
        [
          {
            text: "Yes",
            onPress: () => true
          },
          {
            text: "No",
            onPress: () => false
          }
        ]
      );
    }
    return false;
  },

  className: 'Class'
};

export const Sammamish: CityCode = {
  tpzFunction: (dsh, dlr) => (dsh + dlr) / 2,

  itpzFunction(dsh, dlr) {
    return this.tpzFunction(dsh, dlr) / 2;
  },

  classFunction(dsh) {
    if (isNaN(dsh)) return '';
    if (dsh > 32) return 'Landmark';
    if (dsh > 22) return 'Heritage';
    return '';
  },

  significanceFunction(dsh, commonName) {
    if (dsh >= 12) return true;
    if (dsh >= 8) {
      const tree = treeList.find(tree => tree["Common Name"] === commonName);
      if (tree?.['Leaf Type'].includes("Evergreen")) return true;
    }
    return false;
  },

  className: 'Class'
};

export type TreeType = {
  "Common Name": string;
  "Scientific Name": string;
  "Species Code": string;
  "Growth Form": string;
  "Leaf Type": string;
}

export const getStyles = (darkMode: boolean) => StyleSheet.create({
  backdrop: {
    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
    flex: 1
  },
  card: {
    flex: 1,
    margin: 10,
    marginTop: 50,
    marginBottom: 25,
    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
    borderRadius: 25,
    padding: 16,
    shadowColor: darkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: darkMode ? '#f9fafb' : '#1f2937',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: darkMode ? '#f3f4f6' : '#374151',
  },
  container: {
    flexGrow: 1,
    marginBottom: 16,
    width: '100%',
    position: 'relative',
  },
  formContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: darkMode ? '#374151' : '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    backgroundColor: darkMode ? '#111827' : '#fff',
  },
  formGroup: {
    flex: 1,
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    position: 'absolute',
    top: 1.5,
    left: 3,
    zIndex: 5,
    color: darkMode ? '#d1d5db' : '#4b5563',
  },
  multistemCheckboxText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: darkMode ? '#d1d5db' : '#4b5563',
  },
  textInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: darkMode ? '#4b5563' : '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: darkMode ? '#f9fafb' : '#1f2937',
    backgroundColor: darkMode ? '#374151' : '#ffffff',
    width: '100%',
    textAlign: 'left',
    fontSize: 14,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  suggestionList: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: darkMode ? '#374151' : '#fff',
    borderWidth: 1,
    borderColor: darkMode ? '#4b5563' : '#ccc',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 9999,
    elevation: 5,
  },
  suggestionItem: {
    borderBottomColor: darkMode ? '#4b5563' : '#d1d5db',
    backgroundColor: darkMode ? '#374151' : '#ffffff',
    borderBottomWidth: 1,
    padding: 8,
  },
  suggestionItemText: {
    fontSize: 16,
    color: darkMode ? '#f9fafb' : '#1f2937',
  },
  hiddenItem: {
    alignItems: 'flex-end',
    backgroundColor: 'red',
    justifyContent: 'center',
    flex: 1,
    paddingRight: 10,
  },
  actionButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: { backgroundColor: '#3b82f6' },
  deleteButton: { backgroundColor: '#ef4444' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
  disabledInput: {
    backgroundColor: darkMode ? '#4b5563' : '#f9fafb',
    color: darkMode ? '#9ca3af' : '#9ca3af',
  },
  pickerContainer: {
    flex: 1,
    margin: 8,
    borderWidth: 1,
    borderColor: darkMode ? '#4b5563' : '#d1d5db',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: darkMode ? '#374151' : '#fff',
    overflow: 'hidden'
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 'auto',
    marginTop: Platform.OS === 'ios' ? -80 : 'auto',
    color: darkMode ? 'white' : 'black'
  },
  pickerItemStyle: {
    backgroundColor: darkMode? 'black': 'white',
    color: darkMode ? 'white' : 'black'
  },
  inputGrid: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  multistemContainer: {
    marginTop: 8,
    marginBottom: 16
  },
  multistemCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    height: 20,
    width: 20,
    borderWidth: 1,
    borderColor: darkMode ? '#4b5563' : '#d1d5db',
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxChecked: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  stemInputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: darkMode ? '#4b5563' : '#d1d5db',
    borderRadius: 8,
  },
  stemChips: { flexDirection: 'row', flexWrap: 'wrap', marginRight: 8 },
  stemChip: {
    backgroundColor: darkMode ? '#1e40af' : '#dbeafe',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stemChipText: { color: darkMode ? '#dbeafe' : '#1e40af', fontSize: 12 },
  removeChipText: { marginLeft: 4, color: darkMode ? '#dbeafe' : '#1e40af', fontWeight: 'bold' },
  stemTextInput: {
    borderWidth: 1,
    borderColor: darkMode ? '#4b5563' : '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    backgroundColor: darkMode ? '#374151' : '#fff',
    color: darkMode ? '#f9fafb' : '#1f2937',
  },
  addButton: { backgroundColor: darkMode ? '#4b5563' : '#e5e7eb', padding: 8, borderRadius: 8 },
  addButtonText: { fontSize: 12, fontWeight: 'bold', color: darkMode ? '#f9fafb' : '#4b5563' },
  tableContainer: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: darkMode ? '#4b5563' : '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: darkMode ? '#111827' : '#fff',
  },
  tableWrapper: { flexDirection: 'column' },
  tableRow: {
    flexDirection: 'row',
    maxHeight: 40,
    borderBottomWidth: 1,
    borderColor: darkMode ? '#374151' : '#eee',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: darkMode ? '#1f2937' : '#f3f4f6',
    borderBottomWidth: 1,
    borderColor: darkMode ? '#4b5563' : '#ccc',
  },
  tableCell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderColor: darkMode ? '#374151' : '#eee',
    color: darkMode ? '#f9fafb' : '#1f2937',
  },
  noDataText: {
    padding: 8,
    fontStyle: 'italic',
    color: darkMode ? '#d1d5db' : '#666',
  },
  tableCellNumber: { width: 30 },
  tableCellCommonName: { width: 400 },
  tableCellSpecies: { width: 400 },
  tableCellDSH: { width: 80 },
  tableCellDLR: { width: 80 },
  tableCellTier: { width: 200 },
  tableCellCond: { width: 90 },
  tableCellTPZ: { width: 150 },
  tableCellITPZ: { width: 150 },
  tableCellRetain: { width: 90 },
  tableCellNotes: { width: 500 },
  tableCellActions: { width: 80 },
  headerText: { fontWeight: 'bold', color: darkMode ? '#f9fafb' : '#1f2937' },
  tableScrollVertical: { maxHeight: 200 },
  tableScrollHorizontal: { flexDirection: 'row', width: '100%' },
  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, marginBottom: 24 },
  secondaryButton: { backgroundColor: '#6b21a8', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  secondaryButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  tertiaryButton: { backgroundColor: '#4338ca', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  tertiaryButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: {
    margin: 20,
    backgroundColor: darkMode ? '#1f2937' : 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: darkMode ? '#f9fafb' : '#1f2937' },
  modalSubText: { marginBottom: 15, textAlign: 'center', color: darkMode ? '#d1d5db' : '#6b7280' },
  emailScrollView: { maxHeight: 300, width: '100%', marginBottom: 15, padding: 10, backgroundColor: darkMode ? '#1f2937' : '#f3f4f6', borderRadius: 8 },
  emailContentText: { color: darkMode ? '#f9fafb' : '#1f2937', fontFamily: 'monospace' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { borderRadius: 8, padding: 10, elevation: 2, backgroundColor: darkMode ? '#374151' : '#e5e7eb', flex: 1, marginHorizontal: 5 },
  modalButtonText: { color: darkMode ? '#f9fafb' : '#1f2937', fontWeight: 'bold', textAlign: 'center' },
  modalCopyButton: { backgroundColor: '#3b82f6' },
  modalCopyButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
});
