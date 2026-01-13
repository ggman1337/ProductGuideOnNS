import { supabase } from "./supabaseClient";

export interface Product {
  id: string;
  name: string;
  category: string;
  calories: number | null;
  proteins: number | null;
  fats: number | null;
  carbs: number | null;
  ingredients: string | null;
  harmful: string | null;
  contraindications: string | null;
}

export interface ProductFilter {
  search?: string;
  category?: string;
}

export async function fetchProducts(filters?: {
  search?: string;
  category?: string;
}): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (filters?.category && filters.category !== "Все") {
    query = query.eq("category", filters.category);
  }

  if (filters?.search && filters.search.trim() !== "") {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as Product[];
}
