import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../constants";
import type { CacheData } from '../types';

export class CacheManager {
  static async set<T = any>(key: string, data: T, ttl: number = API_CONFIG.CACHE_TIME): Promise<boolean> {
    try {
      const cacheData: CacheData<T> = {
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

  static async get<T = any>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp, ttl }: CacheData<T> = JSON.parse(cached);

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

  static async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Erro ao remover do cache:", error);
      return false;
    }
  }

  static async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
      return false;
    }
  }

  static async isExpired(key: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return true;

      const { timestamp, ttl }: CacheData = JSON.parse(cached);
      return Date.now() - timestamp > ttl;
    } catch (error) {
      return true;
    }
  }

  static async getAll(): Promise<Record<string, any>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);

      const result: Record<string, any> = {};
      items.forEach(([key, value]) => {
        try {
          result[key] = value ? JSON.parse(value) : null;
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

  static async cleanExpired(): Promise<number> {
    try {
      const all = await this.getAll();
      const now = Date.now();
      const expiredKeys: string[] = [];

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
