import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Alert,
  useColorScheme,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { InventoryIndex, getStyles } from './lib';
import { router, useFocusEffect } from 'expo-router';
import { SwipeListView } from 'react-native-swipe-list-view';

const Index: React.FC = () => {
  const systemTheme = useColorScheme();
  const [darkMode, setDarkMode] = useState<boolean>(systemTheme === 'dark')
  const styles = getStyles(darkMode);

  const [index, setIndex] = useState<InventoryIndex>({ inventories: [] });

  const documentDirectory = `${FileSystem.documentDirectory}`;
  const indexPath = `${documentDirectory}inventoryIndex.json`;
  const getIndex = async () => {
    try {
      const indexFile = await FileSystem.getInfoAsync(indexPath);
      if (indexFile.exists) {
        const text = await FileSystem.readAsStringAsync(indexPath);
        const parsed: InventoryIndex = JSON.parse(text);
        setIndex(parsed);
      }
    } catch (error) {
      console.error("Failed to load index:", error);
    }
  };

  // Load inventories
  useEffect(() => {
    console.log("fetching ids...")
    getIndex();
    console.log("fetched.")
  }, [indexPath])
  useFocusEffect(
    useCallback(() => {
      console.log("fetching ids...")
      getIndex();
      console.log("fetched.")
    }, [indexPath])
  )

  // Delete inventory function
  const deleteInventory = async (id: number) => {
    Alert.alert(
      'Delete Inventory',
      'Are you sure you want to delete this inventory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const newInventories = index.inventories.filter(inv => inv.id !== id);
            const newIndex = { inventories: newInventories };
            setIndex(newIndex);
            await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(newIndex));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.backdrop}>
    <View style={styles.card}>
      <Text style={styles.title}>Inventories</Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={async () => {
          router.navigate({ pathname: "/inventory" });
          console.log(await FileSystem.readDirectoryAsync(documentDirectory));
          console.log(await FileSystem.readAsStringAsync(indexPath));
        }}
      >
        <Text style={styles.primaryButtonText}>New Inventory</Text>
      </TouchableOpacity>

    <SwipeListView<{ id: number; address: string }>
      data={index.inventories}
      keyExtractor={(item) => item.id.toString()}
      style={{marginTop: 20}}
      rightOpenValue={-100}
      disableRightSwipe
      renderItem={({ item }) => (
        // Visible item — your normal card style
        <View style={[styles.suggestionItem]}>
          <TouchableOpacity
            style={{ padding: 10 }}
            onPress={() => {
              router.navigate({
                pathname: "/inventory",
                params: { invId: item.id },
              });
            }}
          >
            {item.address !== "" ? (
              <Text style={[styles.suggestionItemText, { fontWeight: 'bold' }]}>{item.address}</Text>
            ) : (
              <Text style={[styles.suggestionItemText, { fontStyle: 'italic' }]}>[{item.id}]</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      renderHiddenItem={({ item }) => (
        // Hidden item — appears when swiped
        <View
          style={styles.hiddenItem}
        >
          <TouchableOpacity
            onPress={() => deleteInventory(item.id)}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    />
    </View>
    </View>
  );
};

export default Index;
