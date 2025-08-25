import { StyleSheet } from 'react-native';

export interface Tree {
  id: number;
  treeType: 'Onsite' | 'Adjacent' | 'ROW';
  commonName: string;
  species: string;
  dsh: string;
  dlr: string;
  tier: string;
  cond: string;
  tpz: string;
  itpz: string;
  retain: string;
  notes: string;
  isMultistem: boolean;
  stemDSHs: string[];
}

export interface NewTreeForm {
  treeType: 'Onsite' | 'Adjacent' | 'ROW';
  commonName: string;
  species: string;
  dsh: string;
  dlr: string;
  tier: string;
  cond: string;
  tpz: string;
  itpz: string;
  retain: string;
  notes: string;
  isMultistem: boolean;
  stemDSHs: string[];
}

export type SearchType = 'Common Name' | 'Tree Code' | 'Scientific Name';
export type City = 'Seattle' | 'Bellevue' | 'Kirkland' | 'Redmond' | 'Sammamish'

export interface CityCode {
  tpzFunction: ((dsh: number, dlr: number) => number);
  itpzFunction: ((dsh: number, dlr: number) => number);
  classFunction: ((dsh: number, commonName: string) => any)
  significanceFunction: ((dsh: number, commonName: string) => boolean);
  className: 'Tier' | 'Class';
}

class Seattle implements CityCode {
  tpzFunction = (dsh: number, dlr: number) => {
    return((dsh + dlr)/2);
  };

  itpzFunction = (dsh: number, dlr: number) => {
    return(this.tpzFunction(dsh, dlr)/2);
  };

  classFunction = (dsh: number, commonName: string) => {
    if (isNaN(dsh)) return '';
    if (dsh <= 12) return '4';
    if (dsh <= 24) return '3';
    if (dsh > 24) return '2';
    return '';
  };

  significanceFunction = (dsh: number, commonName: string) => {
    return(dsh >= 6);
  };

  className: 'Tier' | 'Class' = "Tier";
}

export type TreeType = {
  "Common Name": string;
  "Scientific Name": string;
  "Species Code": string;
  "Growth Form": string;
}

export const styles = StyleSheet.create({
  card: {
    margin: 10,
    marginTop: 50,
    marginBottom: 25,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 16,
    shadowColor: '#000',
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
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#374151',
  },
  formContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4b5563',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#1f2937',
    marginBottom: 8,
    flexGrow: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  suggestionList: {
    position: 'absolute',
    top: 45, // adjust to match your TextInput height
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 9999,
    elevation: 5, // Android stacking
  },
  suggestionItem: {
    borderBottomColor: '#d1d5db',
    borderBottomWidth: 1,
    padding: 12
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  inputGrid: {
    flex: 1,
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 0,
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
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  multistemContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  multistemCheckbox: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checkbox: {
    height: 20,
    width: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  stemInputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  stemChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 8,
  },
  stemChip: {
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stemChipText: {
    color: '#1e40af',
    fontSize: 12,
  },
  removeChipText: {
    marginLeft: 4,
    color: '#1e40af',
    fontWeight: 'bold',
  },
  stemTextInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#e5e7eb',
    padding: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  tableContainer: {
    marginBottom: 24,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden', // Required for horizontal scroll to work cleanly
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
    paddingHorizontal: 4,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#4b5563',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    flex: 0.8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 10,
  },
  noDataText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 24,
  },
  secondaryButton: {
    backgroundColor: '#6b21a8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tertiaryButton: {
    backgroundColor: '#4338ca',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  tertiaryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalSubText: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#6b7280',
  },
  emailScrollView: {
    maxHeight: 300,
    width: '100%',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  emailContentText: {
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    backgroundColor: '#e5e7eb',
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#1f2937',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalCopyButton: {
    backgroundColor: '#3b82f6',
  },
  modalCopyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
