import { Product, Store, Category } from '../types';

export interface SearchResults {
    products: Product[];
    stores: Store[];
    categories: Category[];
}

export const searchCampusCatalog = (
    query: string,
    campusId: string | null,
    products: Product[],
    stores: Store[],
    categories: Category[]
): SearchResults => {
    if (!query.trim() || !campusId) return { products: [], stores: [], categories: [] };

    const term = query.toLowerCase().trim();

    return {
        products: products.filter(p =>
            p.campusId === campusId &&
            p.isAvailable &&
            (p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term))
        ),
        stores: stores.filter(s =>
            s.campusId === campusId &&
            s.isOpen &&
            (s.name.toLowerCase().includes(term) || s.description.toLowerCase().includes(term))
        ),
        categories: categories.filter(c =>
            c.name.toLowerCase().includes(term) || (c.description && c.description.toLowerCase().includes(term))
        )
    };
};
