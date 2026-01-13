import { getString, setString } from "@nativescript/core/application-settings";

const KEY = "favoriteProducts";

export function getFavoriteIds(): string[] {
  const raw = getString(KEY, "[]");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function toggleFavorite(id: string): void {
  const list = getFavoriteIds();
  const index = list.indexOf(id);
  if (index >= 0) {
    list.splice(index, 1);
  } else {
    list.push(id);
  }
  setString(KEY, JSON.stringify(list));
}
