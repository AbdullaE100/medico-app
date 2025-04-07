import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStorage = () => {
  const getItem = async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  };

  const setItem = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Error writing to storage:', error);
      return false;
    }
  };

  const removeItem = async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from storage:', error);
      return false;
    }
  };

  return {
    getItem,
    setItem,
    removeItem,
  };
}; 