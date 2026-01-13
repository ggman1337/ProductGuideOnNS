<script lang="ts" setup>
import { ref, computed, onMounted } from "nativescript-vue";
import { fetchProducts, type Product } from "../services/productService";
import {
    getFavoriteIds,
    toggleFavorite,
} from "../services/favouriteService";

const allProducts = ref<Product[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const search = ref("");
const categories = ref<string[]>(["Все"]);
const selectedCategoryIndex = ref(0);
const onlyFavorites = ref(false);

const selectedProduct = ref<Product | null>(null);
const favoriteIds = ref<string[]>(getFavoriteIds());
const searchBarEnabled = ref(false);

async function loadProducts() {
    try {
        loading.value = true;
        error.value = null;

        const data = await fetchProducts();

        allProducts.value = data;

        const uniqueCategories = Array.from(
            new Set(allProducts.value.map((p) => p.category)),
        );
        categories.value = ["Все", ...uniqueCategories];

        if (selectedProduct.value) {
            const fresh = allProducts.value.find(
                (p) => p.id === selectedProduct.value!.id,
            );
            selectedProduct.value = fresh || null;
        }

        favoriteIds.value = getFavoriteIds();
    } catch (e) {
        console.error(e);
        error.value = "Не удалось загрузить продукты";
    } finally {
        loading.value = false;
    }
}

function onCategoryChange(args: any) {
    const picker = args.object as any;
    selectedCategoryIndex.value = picker.selectedIndex;
}

const filteredProducts = computed(() => {
    let list = allProducts.value;

    const currentCategory =
        categories.value[selectedCategoryIndex.value] || "Все";
    if (currentCategory !== "Все") {
        list = list.filter((p) => p.category === currentCategory);
    }

    const term = search.value.trim().toLowerCase();
    if (term) {
        list = list.filter((p) => p.name.toLowerCase().includes(term));
    }

    if (onlyFavorites.value) {
        const favIds = favoriteIds.value;
        list = list.filter((p) => favIds.includes(p.id));
    }

    return list;
});

function onProductTap(args: any) {
    const product = filteredProducts.value[args.index];
    selectedProduct.value = product;
}

function isFavorite(id: string): boolean {
    return favoriteIds.value.includes(id);
}

function toggleFavoriteForSelected() {
    if (!selectedProduct.value) return;
    const id = selectedProduct.value.id;

    toggleFavorite(id);

    const index = favoriteIds.value.indexOf(id);
    if (index >= 0) {
        favoriteIds.value.splice(index, 1);
    } else {
        favoriteIds.value.push(id);
    }
}
function closeProduct() {
    selectedProduct.value = null;
}

onMounted(() => {
    loadProducts();
    setTimeout(() => {
        searchBarEnabled.value = true;
    }, 300);
});
</script>


<template>
    <Page>
        <ActionBar title="Справочник продуктов" />

        <GridLayout rows="auto, *">

            <ScrollView row="0">
                <StackLayout class="p-4" verticalAlignment="top">
                    <SearchBar
                        v-model="search"
                        :isEnabled="searchBarEnabled"
                        hint="Поиск по названию..."
                        class="search-field"
                    />

                    <StackLayout class="mt-2">
                        <Label text="Категория" />
                        <ListPicker
                            :items="categories"
                            :selectedIndex="selectedCategoryIndex"
                            @selectedIndexChange="onCategoryChange"
                        />
                    </StackLayout>

                    <StackLayout
                        orientation="horizontal"
                        class="mt-2"
                        verticalAlignment="center"
                    >
                        <Switch v-model="onlyFavorites" />
                        <Label
                            text="Показывать только избранные"
                            class="ml-2"
                        />
                    </StackLayout>

                    <Label v-if="error" :text="error" class="error mt-2" />

                    <ActivityIndicator
                        :busy="loading"
                        v-if="loading"
                        class="mt-2"
                    />

                    <ScrollView v-if="selectedProduct" class="mt-4" height="450">
                        <StackLayout class="card">
                            <GridLayout columns="*, auto">
                                <Label text="Информация о продукте" class="h2 mb-2" col="0" />
                                <Button
                                    col="1"
                                    text="✖"
                                    class="close-button"
                                    @tap="closeProduct"
                                />
                            </GridLayout>

                            <Label :text="selectedProduct.name" class="h1 mb-1" />

                            <Label :text="`Категория: ${selectedProduct.category}`" />
                            <Label
                                v-if="selectedProduct.calories != null"
                                :text="`Калорийность: ${selectedProduct.calories} ккал на 100 г`"
                            />
                            <Label
                                v-if="selectedProduct.proteins != null"
                                :text="`Белки: ${selectedProduct.proteins} г`"
                            />
                            <Label
                                v-if="selectedProduct.fats != null"
                                :text="`Жиры: ${selectedProduct.fats} г`"
                            />
                            <Label
                                v-if="selectedProduct.carbs != null"
                                :text="`Углеводы: ${selectedProduct.carbs} г`"
                            />

                            <Label
                                v-if="selectedProduct.ingredients"
                                text="Состав:"
                                class="section-title mt-2"
                            />
                            <Label
                                v-if="selectedProduct.ingredients"
                                :text="selectedProduct.ingredients"
                                textWrap="true"
                            />

                            <Label
                                v-if="selectedProduct.harmful"
                                text="Возможный вред:"
                                class="section-title mt-2"
                            />
                            <Label
                                v-if="selectedProduct.harmful"
                                :text="selectedProduct.harmful"
                                textWrap="true"
                            />

                            <Label
                                v-if="selectedProduct.contraindications"
                                text="Противопоказания:"
                                class="section-title mt-2"
                            />
                            <Label
                                v-if="selectedProduct.contraindications"
                                :text="selectedProduct.contraindications"
                                textWrap="true"
                            />

                            <Button
                                class="mt-3 fav-button"
                                :text="
                                    isFavorite(selectedProduct.id)
                                        ? 'Убрать из избранного'
                                        : 'Добавить в избранное'
                                "
                                @tap="toggleFavoriteForSelected"
                            />
                        </StackLayout>
                    </ScrollView>
                </StackLayout>
            </ScrollView>

            <ListView
                v-if="!loading && filteredProducts.length && !selectedProduct"
                row="1"
                :items="filteredProducts"
                @itemTap="onProductTap"
                class="mt-4"
            >
                <template #default="{ item }">
                    <GridLayout columns="*, auto" rows="auto" class="list-item">
                        <StackLayout col="0">
                            <Label :text="item.name" class="item-name" />
                            <Label
                                :text="item.category"
                                class="item-category"
                            />
                            <Label
                                v-if="item.calories != null"
                                :text="`Калории: ${item.calories} ккал`"
                                class="item-cal"
                            />
                        </StackLayout>
                        <Label
                            col="1"
                            :text="isFavorite(item.id) ? '★' : '☆'"
                            class="fav-star"
                        />
                    </GridLayout>
                </template>
            </ListView>

            <StackLayout
                v-if="!loading && !filteredProducts.length && !error && !selectedProduct"
                row="1"
                verticalAlignment="center"
                horizontalAlignment="center"
            >
                <Label text="Ничего не найдено" class="mt-4" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>
