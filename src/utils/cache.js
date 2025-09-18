import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../constants";

export class CacheManager {
  static async set(key, data, ttl = API_CONFIG.CACHE_TIME) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error("Erro ao salvar no cache:", error);
      return false;
    }
  }

  static async get(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);

      // Check if cache is expired
      if (Date.now() - timestamp > ttl) {
        await this.remove(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Erro ao recuperar do cache:", error);
      return null;
    }
  }

  static async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Erro ao remover do cache:", error);
      return false;
    }
  }

  static async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
      return false;
    }
  }

  static async isExpired(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return true;

      const { timestamp, ttl } = JSON.parse(cached);
      return Date.now() - timestamp > ttl;
    } catch (error) {
      return true;
    }
  }

  static async getAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);

      const result = {};
      items.forEach(([key, value]) => {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      });

      return result;
    } catch (error) {
      console.error("Erro ao recuperar todos os itens do cache:", error);
      return {};
    }
  }

  static async cleanExpired() {
    try {
      const all = await this.getAll();
      const now = Date.now();
      const expiredKeys = [];

      Object.entries(all).forEach(([key, value]) => {
        if (value && typeof value === "object" && value.timestamp && value.ttl) {
          if (now - value.timestamp > value.ttl) {
            expiredKeys.push(key);
          }
        }
      });

      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
        console.log(`Removidos ${expiredKeys.length} itens expirados do cache`);
      }

      return expiredKeys.length;
    } catch (error) {
      console.error("Erro ao limpar itens expirados:", error);
      return 0;
    }
  }
}

export default CacheManager;