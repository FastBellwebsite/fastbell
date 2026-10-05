import { Category } from '../../types';

export const seedCategories: Category[] = [
    {
        id: 'cat-food',
        name: 'Food & Snacks',
        slug: 'food',
        icon: '/products/cheese-grilled-sandwich.webp',
        description: 'Hot meals, canteens and quick snacks'
    },
    {
        id: 'cat-grocery',
        name: 'Groceries',
        slug: 'groceries',
        icon: '/products/amul-milk.webp',
        description: 'Packaged groceries and pantry essentials'
    },
    {
        id: 'cat-stationery',
        name: 'Stationery',
        slug: 'stationery',
        icon: '/products/classmate-notebook.webp',
        description: 'Notebooks, pens, and exam supplies'
    },
    {
        id: 'cat-care',
        name: 'Personal Care',
        slug: 'personal-care',
        icon: '/products/dettol-sanitizer.webp',
        description: 'Dorm hygiene, wellness and grooming'
    },
    {
        id: 'cat-laundry',
        name: 'Laundry & Ironing',
        slug: 'laundry',
        icon: '/products/daily-wash.webp',
        description: 'Hostel wash, steam press, and bag pickup'
    }
];

