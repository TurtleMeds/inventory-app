import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  ScrollView,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import TextInput from '../components/TextInput'
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import treeList from '../assets/data/treeList.json';
import Papa from 'papaparse';
import {
  Tree,
  NewTreeForm,
  SearchType,
  City,
  TreeType,
  styles,
} from './lib'

// Custom component for the table header.
const TableHeader: React.FC = () => (
  <View style={styles.tableRowHeader}>
    <Text style={[styles.tableCell, styles.headerText, { flex: 0.5 }]}>#</Text>
    <Text style={[styles.tableCell, styles.headerText, { flex: 1.5 }]}>Common Name</Text>
    <Text style={[styles.tableCell, styles.headerText, { flex: 1.5 }]}>Species</Text>
    <Text style={[styles.tableCell, styles.headerText]}>DSH</Text>
    <Text style={[styles.tableCell, styles.headerText]}>DLR</Text>
    <Text style={[styles.tableCell, styles.headerText, { flex: 0.8 }]}>Tier</Text>
    <Text style={[styles.tableCell, styles.headerText, { flex: 0.8 }]}>Cond</Text>
    <Text style={[styles.tableCell, styles.headerText]}>TPZ</Text>
    <Text style={[styles.tableCell, styles.headerText]}>ITPZ</Text>
    <Text style={[styles.tableCell, styles.headerText, { flex: 0.8 }]}>Retain</Text>
    <Text style={[styles.tableCell, styles.headerText, { flex: 2 }]}>NOTES</Text>
    <Text style={[styles.tableCell, styles.headerText, { flex: 0.8 }]}>Actions</Text>
  </View>
);

// Main App component
const Inventory: React.FC = () => {

  const MIN_TPZ_FEET = 5;

  const [city, setCity] = useState<City>();
  const [searchType, setSearchType] = useState<SearchType>();
  
  // State for general site information.
  const [address, setAddress] = useState<string>('');
  const [siteNotes, setSiteNotes] = useState<string>(`This site will need tree protection for adjacent trees.
Add TPZ and ITPZ to your site plan.
Tree protection fencing must be shown on the plan and must be outside of the ITPZ of all trees.`);

  const [expanded, setExpanded] = useState<boolean>(false);

  // State for the main tree inventory table.
  const [trees, setTrees] = useState<Tree[]>([]);

  // State for the autocomplete
  const [suggestions, setSuggestions] = useState<TreeType[]>([]);

  // State for the new tree form input.
  const [newTree, setNewTree] = useState<NewTreeForm>({
    treeType: 'Onsite',
    commonName: '',
    species: '',
    dsh: '',
    dlr: '',
    tier: '',
    cond: '',
    tpz: '',
    itpz: '',
    retain: '',
    notes: '',
    isMultistem: false,
    stemDSHs: [],
  });

  // State for temporary stem DSH input.
  const [currentStemDSH, setCurrentStemDSH] = useState<string>('');

  // State for managing the email modal visibility and content.
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailContent, setEmailContent] = useState<string>('');

  // Function to calculate Tier based on DSH.
  const calculateTier = (dshValue: string): string => {
    const dsh = parseFloat(dshValue);
    if (isNaN(dsh)) return '';
    if (dsh <= 12) return '4';
    if (dsh <= 24) return '3';
    if (dsh > 24) return '2';
    return '';
  };

  // Function to calculate TPZ and ITPZ based on DLR (and DSH if DLR is missing).
  const calculateProtectionZones = (dshValue: string, dlrValue: string) => {
    const dsh = parseFloat(dshValue);
    const dlr = parseFloat(dlrValue);

    let tpz = '';
    let itpz = '';

    if (!isNaN(dsh) && !isNaN(dlr) && (dsh > 0 || dlr > 0)) {
      tpz = Math.max(MIN_TPZ_FEET, ((dsh + dlr) / 2)).toFixed(1);
    } else if (!isNaN(dsh) && dsh > 0) {
      tpz = Math.max(MIN_TPZ_FEET, dsh).toFixed(1);
    } else if (!isNaN(dlr) && dlr > 0) {
      tpz = Math.max(MIN_TPZ_FEET, dlr).toFixed(1);
    }

    if (parseFloat(tpz) > 0) {
      itpz = (parseFloat(tpz)/2.0).toString();
    }

    return { tpz, itpz };
  };

  // Effect to auto-fill Tier, TPZ, and ITPZ when DSH or DLR changes.
  useEffect(() => {
    const { dsh, dlr, treeType } = newTree;

    if (treeType === 'Onsite') {
      const autoTier = calculateTier(dsh);
      setNewTree((prevTree) => ({ ...prevTree, tier: autoTier }));
    } else if (treeType === 'ROW') {
      setNewTree((prevTree) => ({ ...prevTree, tier: 'ROW' }));
    } else {
      if (newTree.tier !== '') {
        setNewTree((prevTree) => ({ ...prevTree, tier: '' }));
      }
    }

    const { tpz, itpz } = calculateProtectionZones(dsh, dlr);
    setNewTree((prevTree) => ({ ...prevTree, tpz, itpz }));

  }, [newTree.dsh, newTree.dlr, newTree.treeType]);

  // Effect to auto-fill DSH for multistem trees.
  useEffect(() => {
    if (newTree.isMultistem && newTree.stemDSHs.length > 0) {
      const sumOfSquares = newTree.stemDSHs.reduce((sum, dsh) => sum + Math.pow(parseFloat(dsh), 2), 0);
      const calculatedDSH = Math.sqrt(sumOfSquares).toFixed(1);
      setNewTree(prevTree => ({ ...prevTree, dsh: calculatedDSH }));
    } else if (newTree.isMultistem && newTree.stemDSHs.length === 0) {
      setNewTree(prevTree => ({ ...prevTree, dsh: '' }));
    }
  }, [newTree.isMultistem, newTree.stemDSHs]);

  const handleExpand = () => {
    setExpanded(!expanded);
  }

  const handleAutocomplete = (name: string) => {
    Keyboard.dismiss();
    setNewTree(prevTree => ({ ...prevTree, commonName: name}));
    const match = treeList.find(tree => tree["Common Name"] == name);
    if (match) {
      setNewTree(prevTree => ({ ...prevTree, species: match["Scientific Name"]}));
    }
  }


  // Handler for input changes in the new tree form.
  const handleNewTreeChange = (name: keyof NewTreeForm, value: string) => {
    setNewTree((prevTree) => ({
      ...prevTree,
      [name]: value,
    }));
    if (name === 'commonName') {
      if (value.trim().length > 0) {
        const filtered = treeList.filter((item) =>
          item['Common Name'].toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
      }
    }
  };

  // Handler for multistem checkbox.
  const toggleMultistem = () => {
    setNewTree((prevTree) => ({
      ...prevTree,
      isMultistem: !prevTree.isMultistem,
      stemDSHs: !prevTree.isMultistem ? [] : prevTree.stemDSHs, // Clear stems if unchecked
      dsh: !prevTree.isMultistem ? '' : prevTree.dsh, // Clear DSH if unchecked
    }));
  };

  // Handler for adding a new stem DSH.
  const addStemDSH = () => {
    const dsh = parseFloat(currentStemDSH);
    if (!isNaN(dsh) && dsh > 0) {
      setNewTree((prevTree) => ({
        ...prevTree,
        stemDSHs: [...prevTree.stemDSHs, dsh.toString()],
      }));
      setCurrentStemDSH('');
    }
  };

  // Function to remove a stem DSH.
  const removeStemDSH = (indexToRemove: number) => {
    setNewTree((prevTree) => ({
      ...prevTree,
      stemDSHs: prevTree.stemDSHs.filter((_, index) => index !== indexToRemove),
    }));
  };

  // Function to add a new tree to the inventory.
  const addTree = () => {
    if (newTree.commonName && newTree.species) {
      setTrees((prevTrees) => [...prevTrees, { ...newTree, id: Date.now(), stemDSHs: newTree.stemDSHs }]);
      setNewTree({
        treeType: 'Onsite',
        commonName: '',
        species: '',
        dsh: '',
        dlr: '',
        tier: '',
        cond: '',
        tpz: '',
        itpz: '',
        retain: '',
        notes: '',
        isMultistem: false,
        stemDSHs: [],
      });
      setCurrentStemDSH('');
    }
  };

  // Function to delete a tree from the inventory.
  const deleteTree = (id: number) => {
    setTrees((prevTrees) => trees.filter((tree) => tree.id !== id));
  };

  // Function to export tree data to CSV - Placeholder for React Native.
  const exportToCsv = async () => {
    const csvContent = Papa.unparse(trees);
    try {
      const path = `${FileSystem.documentDirectory}tree table for ${address}.csv`;
      await FileSystem.writeAsStringAsync(path, csvContent);
      if (await Sharing.isAvailableAsync()) {
        Sharing.shareAsync(path);
      } else {
        Alert.alert("Something went wrong when sharing the file.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Function to generate the email content as plain text.
const generateEmail = () => {
  const calculatedTierCounts = {
    tier1: 0,
    tier2: 0,
    tier3: 0,
    tier4: 0,
    row: 0,
    adjacent: 0,
    groves: 0,
  };

  trees.forEach(tree => {
    if (tree.treeType === 'Onsite') {
      switch (tree.tier) {
        case '1': calculatedTierCounts.tier1++; break;
        case '2': calculatedTierCounts.tier2++; break;
        case '3': calculatedTierCounts.tier3++; break;
        case '4': calculatedTierCounts.tier4++; break;
        default: break;
      }
    } else if (tree.treeType === 'ROW') {
      calculatedTierCounts.row++;
    } else if (tree.treeType === 'Adjacent') {
      calculatedTierCounts.adjacent++;
    }
  });

  let plainTextEmailBody = `
Address: ${address}

Summary of trees:
- Tier 1 = ${calculatedTierCounts.tier1}
- Tier 2 = ${calculatedTierCounts.tier2}
- Tier 3 = ${calculatedTierCounts.tier3}
- Tier 4 = ${calculatedTierCounts.tier4}
- ROW = ${calculatedTierCounts.row}
- Adjacent = ${calculatedTierCounts.adjacent}
- Groves = ${calculatedTierCounts.groves}
`;

  // one combined HTML table
  const generateHTMLTable = (sections: { title: string; trees: Tree[]; type: string }[]) => {
    let tableHTML = `
      <table border="1" cellspacing="0" cellpadding="4" style="border-collapse: collapse; width: 100%; margin-top: 12px;">
        <thead>
          <tr>
            <th>Tree #</th>
            <th>Common Name</th>
            <th>Species</th>
            <th>DSH</th>
            <th>DLR</th>
            <th>Tier</th>
            <th>Cond</th>
            <th>TPZ</th>
            <th>ITPZ</th>
            <th>Retain</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
    `;

    sections.forEach(({ title, trees, type }) => {
      if (trees.length === 0) return;

      // section header row inside table
      tableHTML += `
        <tr>
          <td colspan="11" style="font-weight: bold; background-color: #f3f4f6; text-align: left;">${title}</td>
        </tr>
      `;

      trees.forEach((tree, index) => {
        let notesContent = tree.notes || '';
        if (tree.isMultistem && tree.stemDSHs && tree.stemDSHs.length > 0) {
          notesContent += ` (Multistem: ${tree.stemDSHs.join(', ')})`;
        }

        // numbering rule:
        let treeNumber = '';
        if (type === 'ROW') {
          treeNumber = `ROW-${index + 1}`;
        } else if (type === 'Onsite') {
          treeNumber = `${index + 1}`;
        } else if (type === 'Adjacent') {
          treeNumber = String.fromCharCode(65 + index); // A, B, C...
        }

        tableHTML += `
          <tr>
            <td>${treeNumber}</td>
            <td>${tree.commonName || ''}</td>
            <td>${tree.species || ''}</td>
            <td>${tree.dsh || ''}</td>
            <td>${tree.dlr || ''}</td>
            <td>${tree.tier || ''}</td>
            <td>${tree.cond || ''}</td>
            <td>${tree.tpz || ''}</td>
            <td>${tree.itpz || ''}</td>
            <td>${tree.retain || ''}</td>
            <td>${notesContent}</td>
          </tr>
        `;
      });
    });

    tableHTML += `
        </tbody>
      </table>
    `;
    return tableHTML;
  };

  const rowTrees = trees.filter(tree => tree.treeType === 'ROW');
  const onsiteTrees = trees.filter(tree => tree.treeType === 'Onsite');
  const adjacentTrees = trees.filter(tree => tree.treeType === 'Adjacent');

  plainTextEmailBody += generateHTMLTable([
    { title: 'ROW (Right of Way) Trees', trees: rowTrees, type: 'ROW' },
    { title: 'Onsite Trees', trees: onsiteTrees, type: 'Onsite' },
    { title: 'Adjacent Trees', trees: adjacentTrees, type: 'Adjacent' },
  ]);

  plainTextEmailBody += `\n\nSite Notes:\n${siteNotes}`;

  setEmailContent(plainTextEmailBody);
  setShowEmailModal(true);
};

  // Function to copy email content to clipboard.
  const copyEmailToClipboard = async () => {
    await Clipboard.setStringAsync(emailContent, {inputFormat: Clipboard.StringFormat.HTML});
    Alert.alert('Copied!', 'Email content has been copied to your clipboard.');
    setShowEmailModal(false);
  };

  const renderTreeTable = (treeList: Tree[], title: string, prefix: string) => {
    if (treeList.length === 0) {
      return (
        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.noDataText}>No {title.toLowerCase()} added yet.</Text>
        </View>
      );
    }
    return (
      <View style={styles.tableContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.tableWrapper}>
          <View>
            <TableHeader />
            {treeList.map((tree, index) => (
              <View key={tree.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>
                  {prefix === 'Onsite-' ? `${index + 1}` : prefix === 'ROW-' ? `ROW-${index + 1}` : `${String.fromCharCode(65 + index)}`}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{tree.commonName}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{tree.species}</Text>
                <Text style={styles.tableCell}>{tree.dsh}</Text>
                <Text style={styles.tableCell}>{tree.dlr}</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>{tree.tier}</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>{tree.cond}</Text>
                <Text style={styles.tableCell}>{tree.tpz}</Text>
                <Text style={styles.tableCell}>{tree.itpz}</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>{tree.retain}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{tree.notes}</Text>
                <TouchableOpacity
                  onPress={() => deleteTree(tree.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const dismissAll = () => {
    Keyboard.dismiss();
    setSuggestions([]);
  }
  const onsiteTrees = trees.filter(tree => tree.treeType === 'Onsite');
  const rowTrees = trees.filter(tree => tree.treeType === 'ROW');
  const adjacentTrees = trees.filter(tree => tree.treeType === 'Adjacent');

  return (
    <TouchableWithoutFeedback onPress={dismissAll} accessible={false}>
    <ScrollView keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false} style={styles.card}>
      <Text style={styles.title}>Tree Inventory</Text>
      
      {/* Address Input */}

      <View style={styles.formContainer}>
        <TouchableOpacity onPress={handleExpand}>
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
                title="Address"
                value={address}
                onChangeText={setAddress}
              />
            </View>
            <Text style={styles.label}>City:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                style={styles.picker}
                onValueChange={setCity}
              >
                <Picker.Item label="Seattle" value="Seattle"/>
                <Picker.Item label="Bellevue" value="Bellevue"/>
                <Picker.Item label="Kirkland" value="Kirkland"/>
                <Picker.Item label="Redmond" value="Redmond"/>
                <Picker.Item label="Sammamish" value="Sammamish"/>
              </Picker>
            </View>
            <Text style={styles.label}>Search by...</Text>
            <View style={styles.pickerContainer}>
              <Picker
                style={styles.picker}
                onValueChange={setSearchType}
              >
                <Picker.Item label="Common Name" value="Common Name"/>
                <Picker.Item label="Tree Code" value="Tree Code"/>
                <Picker.Item label="Scientific Name" value="Scientific Name"/>
              </Picker>
            </View>
          </View>
        )}
      </View>

      {/* Add New Tree Form */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Add New Tree</Text>

        <View style={styles.pickerContainer}>
          {/* Note: The generic type on Picker is removed to avoid potential Expo Router issues. */}
          <Picker
            selectedValue={newTree.treeType}
            onValueChange={(itemValue) => handleNewTreeChange('treeType', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Onsite Tree" value="Onsite" />
            <Picker.Item label="Adjacent Tree" value="Adjacent" />
            <Picker.Item label="ROW (Right of Way) Tree" value="ROW" />
          </Picker>
        </View>
        <View style={styles.inputGrid}>
          <View style={{position: 'relative', width: '100%'}}>
            <TextInput
              style={{marginBottom: 0, zIndex: 2}}
              value={newTree.commonName}
              onChangeText={(text) => handleNewTreeChange('commonName', text)}
              title="Common name"
              onEndEditing={dismissAll}
            />
            {suggestions.length > 0 && (
              <FlatList
                data={suggestions}
                style={styles.suggestionList}
                keyExtractor={(item, index) => index.toString()}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.suggestionItem} onPress={() => handleAutocomplete(item["Common Name"])}>
                    <Text style={{fontSize: 16}}>{item["Common Name"]}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        
          <TextInput
            value={newTree.species}
            onChangeText={(text) => handleNewTreeChange('species', text)}
            title="Species"
          />
          <View style={styles.multistemContainer}>
            <TouchableOpacity onPress={toggleMultistem} style={styles.multistemCheckbox}>
              <View style={[styles.checkbox, newTree.isMultistem && styles.checkboxChecked]} />
              <Text style={styles.label}>Multistem Tree?</Text>
            </TouchableOpacity>
            {newTree.isMultistem && (
              <View style={styles.stemInputRow}>
                <Text style={styles.label}>Stem DSHs:</Text>
                <View style={styles.stemChips}>
                  {newTree.stemDSHs.map((dsh, index) => (
                    <View key={index} style={styles.stemChip}>
                      <Text style={styles.stemChipText}>{dsh}</Text>
                      <TouchableOpacity onPress={() => removeStemDSH(index)}>
                        <Text style={styles.removeChipText}>&times;</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <TextInput
                  style={styles.stemTextInput}
                  value={currentStemDSH}
                  onChangeText={setCurrentStemDSH}
                  title="Add stem DSH"
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={addStemDSH} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add Stem</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <TextInput
            style={newTree.isMultistem && styles.disabledInput}
            value={newTree.dsh}
            onChangeText={(text) => handleNewTreeChange('dsh', text)}
            title="DSH"
            keyboardType="numeric"
            editable={!newTree.isMultistem}
          />
          <TextInput
            value={newTree.dlr}
            onChangeText={(text) => handleNewTreeChange('dlr', text)}
            title="DLR"
            keyboardType="numeric"
          />
          <TextInput
            value={newTree.cond}
            onChangeText={(text) => handleNewTreeChange('cond', text)}
            title="Condition"
          />
          <TextInput
            style={styles.disabledInput}
            value={newTree.tier}
            onChangeText={(text) => handleNewTreeChange('tier', text)}
            title="Tier"
          />
          <TextInput
            style={styles.disabledInput}
            value={newTree.tpz}
            onChangeText={(text) => handleNewTreeChange('tpz', text)}
            title="TPZ"
            editable={false}
          />
          <TextInput
            style={[styles.textInput, styles.disabledInput]}
            value={newTree.itpz}
            onChangeText={(text) => handleNewTreeChange('itpz', text)}
            title="ITPZ"
            editable={false}
          />
          <TextInput
            style={styles.textInput}
            value={newTree.retain}
            onChangeText={(text) => handleNewTreeChange('retain', text)}
            title="Retain"
          />
        </View>
        
        

        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={newTree.notes}
          onChangeText={(text) => handleNewTreeChange('notes', text)}
          title="Tree Notes"
          multiline
        />
        
        <TouchableOpacity onPress={addTree} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Add Tree</Text>
        </TouchableOpacity>
      </View>

      {/* Tree Tables */}
      {renderTreeTable(rowTrees, 'ROW (Right of Way) Trees', 'ROW-')}
      {renderTreeTable(onsiteTrees, 'Onsite Trees', 'Onsite-')}
      {renderTreeTable(adjacentTrees, 'Adjacent Trees', 'Adjacent-')}

      {/* Site Notes */}
      <View style={styles.formGroup}>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={siteNotes}
          onChangeText={setSiteNotes}
          title="Site Notes"
          multiline
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity onPress={exportToCsv} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Export to CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={generateEmail} style={styles.tertiaryButton}>
          <Text style={styles.tertiaryButtonText}>Generate Email</Text>
        </TouchableOpacity>
      </View>

      {/* Email Content Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEmailModal}
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Generated Email Content</Text>
            <Text style={styles.modalSubText}>
              Copy the content below and paste it into your email client.
            </Text>
            <View style={styles.emailScrollView}>
              <Text style={styles.emailContentText}>{emailContent}</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowEmailModal(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={copyEmailToClipboard}
                style={[styles.modalButton, styles.modalCopyButton]}
              >
                <Text style={styles.modalCopyButtonText}>Copy Content</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default Inventory;
