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
  useColorScheme,
  Pressable,
  LogBox,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Fuse, { FuseResult } from 'fuse.js'
import TextInput from '../components/TextInput'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { toast, ToastContainer } from 'expo-toastee'
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import treeList from '../assets/data/treeList.json';
import Papa from 'papaparse';
import {
  Tree,
  NewTreeForm,
  Inventory,
  City,
  Seattle,
  Bellevue,
  Kirkland,
  Redmond,
  Sammamish,
  TreeType,
  getStyles,
  InventoryIndex,
} from './lib'
import SiteSettings from '@/components/SiteSettings';

  LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

// Main App component
const InventoryPage: React.FC = () => {

  const MIN_TPZ_FEET = 5;

  const systemTheme = useColorScheme();
  const [darkMode, setDarkMode] = useState<boolean>(systemTheme === 'dark')
  const styles = getStyles(darkMode);

  const [isDirty, setIsDirty] = useState<boolean>(false);

  const markDirty = () => {
    if (!isDirty) {
      setIsDirty(true)
      console.log("dirty");
    };
  };
  // Navigation
  const navigation = useNavigation();

  // Effect
  useEffect(() => { 
    const listener = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      if (isDirty) {
        Alert.alert(
          "Unsaved changes",
          "You have unsaved changes. Do you want to save before leaving?",
          [
            {
              text: "Don't save",
              style: "destructive",
              onPress: () => navigation.dispatch(e.data.action),
            },
            { text: "Cancel", style: "cancel" },
            {
              text: "Save",
              onPress: () => {
                saveInventory();
                navigation.dispatch(e.data.action);
              },
            },
          ]
        );
      }
      navigation.dispatch(e.data.action);
    });

    return () => {
      navigation.removeListener('beforeRemove', listener);
    };
  }, []);

  const { invId } = useLocalSearchParams();
  const [id, setId] = useState<number>(-1);
  const [loaded, setLoaded] = useState<boolean>(true);

  useEffect(() => {
    const fetchId = async () => {
      try {
        // Case 1: ID comes from URL
        if (invId) {
          console.log("got invId: " + invId)
          const parsedId = parseInt(invId.toString());
          if (!isNaN(parsedId)) {
            setId(parsedId);
            setLoaded(false);
            return;
          }
        }

        console.log("got no invid");

        // Case 2: Generate new ID
        let id = 0;
        let highestId = 0;
        const defaultIndex: InventoryIndex = { inventories: [{ id: 0, address: "", latest: "" }] };
        const documentDirectory = `${FileSystem.documentDirectory}`;
        const indexPath = `${documentDirectory}inventoryIndex.json`;

        const entries = await FileSystem.readDirectoryAsync(documentDirectory);

        let index: InventoryIndex = defaultIndex;

        if (entries.includes("inventoryIndex.json")) {
          const text = await FileSystem.readAsStringAsync(indexPath);
          index = JSON.parse(text);
          index.inventories.forEach((inventory) => {
            highestId = Math.max(highestId, inventory.id);
          });
          id = highestId + 1;
          index.inventories.push({ id, address: "", latest: "" });
        }

        await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(index));
        setId(id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : String(error));
      }
    };

    fetchId();
  }, [invId]);

  const cities: Record<string, City> = {
    Seattle,
    Bellevue,
    Kirkland,
    Redmond,
    Sammamish,
  };

  const [cityName, setCityName] = useState("Seattle");
  const [searchType, setSearchType] = useState<string>('Common Name');
  const [date, setDate] = useState<string>(new Date().toLocaleString('en-US', { timeZone: "America/Los_Angeles" }).split(",")[0].replaceAll("/", "-"))

  
  // State for general site information.
  const [address, setAddress] = useState<string>('');
  const [siteNotes, setSiteNotes] = useState<string>(`This site will need tree protection for adjacent trees.
Add TPZ and ITPZ to your site plan.
Tree protection fencing must be shown on the plan and must be outside of the ITPZ of all trees.
Tree locations must be verified by survey.`);


  // State for the main tree inventory table.
  const [trees, setTrees] = useState<Tree[]>([]);

  // State for the autocomplete
  const [suggestions, setSuggestions] = useState<FuseResult<TreeType>[]>([]);

  // State for the new tree form input.
  const [newTree, setNewTree] = useState<NewTreeForm>({
    treeType: 'Onsite',
    search: '',
    commonName: '',
    species: '',
    dsh: '',
    dlr: '',
    class: '',
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

  const documentDirectory = `${FileSystem.documentDirectory}`;
  const indexPath = `${documentDirectory}inventoryIndex.json`;

  useEffect(() => {
    const loadFromSave = async (id: number) => {
      const index: InventoryIndex = JSON.parse(
        await FileSystem.readAsStringAsync(indexPath)
      );
      console.log(index);

      for (const inventory of index.inventories) {
        console.log(inventory.id, " ", inventory.id == id);
        if (inventory.id == id) {
          console.log("if statement passed");
          console.log(inventory.latest);
          const latest = await FileSystem.getInfoAsync(inventory.latest).catch(console.error);
          console.log("latest", latest);

          if (latest?.exists) {
            let loadpath = inventory.latest;
            console.log("found match");
            let loadedInventory: Inventory = JSON.parse(
              await FileSystem.readAsStringAsync(loadpath)
            );

            setAddress(loadedInventory.address);
            setTrees(loadedInventory.trees);
            setNewTree(loadedInventory.newTree);
            setSiteNotes(loadedInventory.siteNotes);
            setCityName(loadedInventory.cityName);
            setSearchType(loadedInventory.searchType);
          }
        }
      }

      setLoaded(true);
    };

    if (!loaded) loadFromSave(id);
  }, [id]);

  const [fuse, setFuse] = useState<Fuse<TreeType>>(new Fuse(treeList, {
    keys: [searchType]
  }));

  useEffect(() => {
    setFuse(new Fuse(treeList, {
      keys: [searchType]
    }))
  }, [searchType])

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

    const autoClass = cities[cityName].classFunction(parseFloat(newTree.dsh), newTree.commonName, newTree.species, newTree.treeType);
    setNewTree((prevTree) => ({ ...prevTree, class: autoClass }));

    const { tpz, itpz } = calculateProtectionZones(dsh, dlr);
    setNewTree((prevTree) => ({ ...prevTree, tpz, itpz }));

  }, [newTree.dsh, newTree.dlr, newTree.treeType, cityName]);

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

  const handleAutocomplete = (tree: TreeType) => {
    Keyboard.dismiss();
    setNewTree(prevTree => ({ ...prevTree, species: tree['Scientific Name'], commonName: tree['Common Name']}));
  }


  // Handler for input changes in the new tree form.
  const handleNewTreeChange = (name: keyof NewTreeForm, value: string) => {
    setNewTree((prevTree) => ({
      ...prevTree,
      [name]: value,
    }));
    if (name === 'search') {
      if (value.trim().length > 0) {
        const filtered = fuse.search(value);
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
      }
    }
    markDirty();
  };

  // Handler for multistem checkbox.
  const toggleMultistem = () => {
    setNewTree((prevTree) => ({
      ...prevTree,
      isMultistem: !prevTree.isMultistem,
      stemDSHs: !prevTree.isMultistem ? [] : prevTree.stemDSHs, // Clear stems if unchecked
      dsh: !prevTree.isMultistem ? '' : prevTree.dsh, // Clear DSH if unchecked
    }));
    markDirty();
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
    markDirty();
  };

  // Function to remove a stem DSH.
  const removeStemDSH = (indexToRemove: number) => {
    setNewTree((prevTree) => ({
      ...prevTree,
      stemDSHs: prevTree.stemDSHs.filter((_, index) => index !== indexToRemove),
    }));
    markDirty();
  };

  // Function to add a new tree to the inventory.
  const addTree = () => {
    if (newTree.commonName && newTree.species) {
      setTrees((prevTrees) => [...prevTrees, { ...newTree, id: Date.now(), stemDSHs: newTree.stemDSHs }]);
      setNewTree({
        treeType: 'Onsite',
        search: '',
        commonName: '',
        species: '',
        dsh: '',
        dlr: '',
        class: '',
        cond: '',
        tpz: '',
        itpz: '',
        retain: '',
        notes: '',
        isMultistem: false,
        stemDSHs: [],
      });
      markDirty();
      setCurrentStemDSH('');
    }
  };
  const editTree = (id: number) => {
    const treeToEdit = trees.find(t => t.id === id);
    if (treeToEdit) {
      setNewTree(treeToEdit);
      deleteTree(id)
      // Optionally scroll to "Add New Tree" form so user can edit it
    }
  };

  // Function to delete a tree from the inventory.
  const deleteTree = (id: number) => {
    setTrees((prevTrees) => trees.filter((tree) => tree.id !== id));
    markDirty();
  };

  const saveInventory = () => {
    const inventory: Inventory = {
      id: id,
      trees: trees,
      searchType: searchType,
      date: date,
      cityName: cityName,
      siteNotes: siteNotes,
      newTree: newTree,
      address: address
    }

    const path = `${FileSystem.documentDirectory}${address.replaceAll(" ", "_")}, ${date}.arbor`;
    console.log(`current path: ${path}
      current id: ${id}`)

    FileSystem.writeAsStringAsync(path, JSON.stringify(inventory))
      .then(() => {
        toast.success("The inventory was saved!");
        updateInventoryIndex(path);
        setIsDirty(false);
      }, (error) => {toast.error(error)});
  };

  const updateInventoryIndex = (latest: string) => {
    FileSystem.readAsStringAsync(indexPath).then((text) => {
      let index: InventoryIndex = JSON.parse(text);
      index.inventories.forEach(
        (inventory) => {
          if (inventory.id == id) {
            console.log(`latest: ${latest}, address: ${address}`);
            inventory.latest = latest;
            inventory.address = address;
          }
        }
      );
      FileSystem.writeAsStringAsync(indexPath, JSON.stringify(index)).then(() => {
        console.log(`Successfully updated ${indexPath}`);
      });
    }, (error) => {toast.error(error)})
  }

  // Function to export tree data to CSV - Placeholder for React Native.
  const exportToCsv = async () => {
    const csvContent = Papa.unparse(trees);
    try {
      const path = `${FileSystem.cacheDirectory}Tree table for ${address} ${date}.csv`;
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
      switch (tree.class) {
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

  let plainEmailContent = `
Address: ${address}
<br/>
<br/>
Summary of trees:
<br/>
<ul>
<li>Tier 1 = ${calculatedTierCounts.tier1}</li>
<li>Tier 2 = ${calculatedTierCounts.tier2}</li>
<li>Tier 3 = ${calculatedTierCounts.tier3}</li>
<li>Tier 4 = ${calculatedTierCounts.tier4}</li>
<li>ROW = ${calculatedTierCounts.row}</li>
<li>Adjacent = ${calculatedTierCounts.adjacent}</li>
<li>Groves = ${calculatedTierCounts.groves}</li>
</ul>
<br/>
`;

  // one combined HTML table
  const generateHTMLTable = (sections: { title: string; trees: Tree[]; type: string }[]) => {
    let tableHTML = `
      <table border="1" cellspacing="0" cellpadding="4" style="border-collapse: collapse; margin-top: 12px;">
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
          <td colspan="11" style="font-weight: bold; text-align: left;">${title}</td>
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
            <td>${tree.class || ''}</td>
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

  plainEmailContent += `\n\nSite Notes:\n${siteNotes}`.replaceAll("\n", "<br/>");
  plainEmailContent += generateHTMLTable([
    { title: 'ROW (Right of Way) Trees', trees: rowTrees, type: 'ROW' },
    { title: 'Onsite Trees', trees: onsiteTrees, type: 'Onsite' },
    { title: 'Adjacent Trees', trees: adjacentTrees, type: 'Adjacent' },
  ]);
  setEmailContent(plainEmailContent);
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

        <ScrollView
          horizontal={true}
          scrollEventThrottle={16}
          bounces
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={false} // hide default
          contentContainerStyle={{ flexGrow: 1 }}
        >
        <Pressable>
          <View >
            {/* Header */}
            <View style={styles.tableRowHeader}>
              <Text style={[styles.tableCell, styles.tableCellNumber, styles.headerText]}>#</Text>
              <Text style={[styles.tableCell, styles.tableCellActions, styles.headerText]}>Edit</Text>
              <Text style={[styles.tableCell, styles.tableCellCommonName, styles.headerText]}>Common Name</Text>
              <Text style={[styles.tableCell, styles.tableCellSpecies, styles.headerText]}>Species</Text>
              <Text style={[styles.tableCell, styles.tableCellDSH, styles.headerText]}>DSH</Text>
              <Text style={[styles.tableCell, styles.tableCellDLR, styles.headerText]}>DLR</Text>
              <Text style={[styles.tableCell, styles.tableCellTier, styles.headerText]}>{cities[cityName].className}</Text>
              <Text style={[styles.tableCell, styles.tableCellCond, styles.headerText]}>Cond</Text>
              <Text style={[styles.tableCell, styles.tableCellTPZ, styles.headerText]}>TPZ</Text>
              <Text style={[styles.tableCell, styles.tableCellITPZ, styles.headerText]}>ITPZ</Text>
              <Text style={[styles.tableCell, styles.tableCellRetain, styles.headerText]}>Retain</Text>
              <Text style={[styles.tableCell, styles.tableCellNotes, styles.headerText]}>Notes</Text>
              <Text style={[styles.tableCell, styles.tableCellActions, styles.headerText]}>Delete</Text>
            </View>

            {/* Rows */}
            {treeList.map((tree, index) => (
              <View key={tree.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCellNumber]}>
                  {prefix === 'Onsite-' ? `${index + 1}` : prefix === 'ROW-' ? `ROW-${index + 1}` : `${String.fromCharCode(65 + index)}`}
                </Text>
                <View style={[styles.tableCell, styles.tableCellActions, { flexDirection: 'row', gap: 4 }]}>
                  <TouchableOpacity
                    onPress={() => editTree(tree.id)}
                    style={[styles.actionButton, styles.editButton]}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.tableCell, styles.tableCellCommonName]}>{tree.commonName}</Text>
                <Text style={[styles.tableCell, styles.tableCellSpecies]}>{tree.species}</Text>
                <Text style={[styles.tableCell, styles.tableCellDSH]}>{tree.dsh}</Text>
                <Text style={[styles.tableCell, styles.tableCellDLR]}>{tree.dlr}</Text>
                <Text style={[styles.tableCell, styles.tableCellTier]}>{tree.class}</Text>
                <Text style={[styles.tableCell, styles.tableCellCond]}>{tree.cond}</Text>
                <Text style={[styles.tableCell, styles.tableCellTPZ]}>{tree.tpz}</Text>
                <Text style={[styles.tableCell, styles.tableCellITPZ]}>{tree.itpz}</Text>
                <Text style={[styles.tableCell, styles.tableCellRetain]}>{tree.retain}</Text>
                <Text style={[styles.tableCell, styles.tableCellNotes]}>{tree.notes}</Text>
                <View style={[styles.tableCell, styles.tableCellActions, { flexDirection: 'row', gap: 4 }]}>
                  <TouchableOpacity
                    onPress={() => deleteTree(tree.id)}
                    style={[styles.actionButton, styles.deleteButton]}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </Pressable>
        </ScrollView>
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

  if (id == -1) {
    console.log("waiting for id");
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Loading...</Text>
        <ToastContainer/>
      </View>
    );
  }
  return (
    <View style={styles.backdrop}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        style={styles.card}
        contentContainerStyle={{ flexGrow: 1 }}
        extraHeight={80}
        keyboardOpeningTime={0}
      >
        <Pressable onPress={dismissAll} accessible={false}>
          <Text style={styles.title}>{address === '' ? "Untitled Inventory" : address}</Text>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity onPress={saveInventory} style={styles.tertiaryButton}>
              <Text style={styles.tertiaryButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={exportToCsv} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={generateEmail} style={styles.tertiaryButton}>
              <Text style={styles.tertiaryButtonText}>Email</Text>
            </TouchableOpacity>
          </View>
          <SiteSettings
            cityName={cityName}
            date={date}
            address={address}
            searchType={searchType}
            onChange={(k, v) => {
              switch (k) {
                case 'date':
                  setDate(v);
                  break;
                case 'address':
                  setAddress(v);
                  break;
                case 'cityName':
                  setCityName(v);
                  break;
                case 'searchType':
                  setSearchType(v);
                  break;
              }
              markDirty();
            }}
          />
          {/* Add New Tree Form */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Add New Tree</Text>

            <View style={styles.pickerContainer}>
              {/* Note: The generic type on Picker is removed to avoid potential Expo Router issues. */}
              <Picker
                selectedValue={newTree.treeType}
                mode='dropdown'
                onValueChange={(itemValue) => handleNewTreeChange('treeType', itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Onsite Tree" value="Onsite" />
                <Picker.Item label="Adjacent Tree" value="Adjacent" />
                <Picker.Item label="ROW (Right of Way) Tree" value="ROW" />
              </Picker>
            </View>
            <View style={styles.inputGrid}>
              <View style={{ flex: 1, position: 'relative', width: '100%' }}>
                <TextInput
                  style={{marginBottom: 0, zIndex: 2}}
                  value={newTree.search}
                  onChangeText={(text) => handleNewTreeChange('search', text)}
                  title={`Search by ${searchType}`}
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
                      <TouchableOpacity style={styles.suggestionItem} onPress={() => handleAutocomplete(item.item)}>
                        <Text style={styles.suggestionItemText}>{item.item[searchType]}</Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
                <TextInput
                  style={{marginBottom: 0, zIndex: 2}}
                  value={newTree.commonName}
                  onChangeText={(text) => handleNewTreeChange('commonName', text)}
                  title="Common name"
                  onEndEditing={dismissAll}
                />
              </View>
      
              <TextInput
                value={newTree.species}
                onChangeText={(text) => handleNewTreeChange('species', text)}
                title="Scientific Name"
              />
              <View style={styles.multistemContainer}>
                <TouchableOpacity onPress={toggleMultistem} style={styles.multistemCheckbox}>
                  <View style={[styles.checkbox, newTree.isMultistem && styles.checkboxChecked]} />
                  <Text style={styles.multistemCheckboxText}>Multistem Tree?</Text>
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
              textAlignVertical='top'
              onChangeText={setSiteNotes}
              title="Site Notes"
              multiline
            />
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
          <ToastContainer
            defaultPosition='bottom'
          />
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default InventoryPage;
