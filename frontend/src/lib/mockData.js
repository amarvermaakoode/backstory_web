// Central fallback mock data when API connection is unavailable or returning empty data

export const defaultCategories = [
    { _id: "t-shirts", Name: "T-Shirts", slug: "t-shirts", image: "/images/landing-page/first.png" },
    { _id: "hoodies", Name: "Hoodies", slug: "hoodies", image: "/images/landing-page/second.png" },
    { _id: "accessories", Name: "Accessories", slug: "accessories", image: "/images/landing-page/third.png" },
    { _id: "more", Name: "More...", slug: "more", image: "/images/landing-page/pants.png" },
];

export const defaultTribes = [
    { _id: "coders", name: "Coders", slug: "coders", image: "/images/landing-page/tribe1.png" },
    { _id: "bikers", name: "Bikers", slug: "bikers", image: "/images/landing-page/tribe2.png" },
    { _id: "nomad", name: "Nomad", slug: "nomad", image: "/images/landing-page/tribe3.png" },
    { _id: "techies", name: "Techies", slug: "techies", image: "/images/landing-page/tribe4.png" },
];

export const defaultCollections = [
    { _id: "ai-and-tech", Name: "AI and Tech Collection", slug: "ai-and-tech", image: "/images/landing-page/ai-and-tech1.png" },
    { _id: "wonderlust", Name: "Wanderlust Collection", slug: "wonderlust", image: "/images/landing-page/wonderlust1.png" },
];

export const defaultProducts = [
    {
        id: "built-in-public",
        slug: "built-in-public",
        name: "Built in Public",
        price: "Rs 1200",
        priceNum: 1200,
        image: "/images/landing-page/featured11.png",
        hoverImage: "/images/person-image-1-removebg-preview.png",
        sizes: ["S", "M", "L", "XL"],
        colors: [
            { name: "Navy Blue", hex: "#000080", images: ["/images/landing-page/featured11.png"] }
        ],
        tag: "Coders",
        rating: "4.8",
        reviewsCount: 42,
        categoryId: "t-shirts",
        categorySlug: "t-shirts",
        categoryName: "T-Shirts",
        collectionId: "ai-and-tech",
        collectionSlug: "ai-and-tech",
        collectionName: "AI and Tech Collection",
        subCategoryId: "coders",
        subCategorySlug: "coders",
        subCategoryName: "Coders",
        link: "/products/built-in-public",
        description: "Designed for creators and builders sharing their path openly. Features custom typographical design on heavy drop-shoulder cotton.",
        details: {
            material: "100% Organic Cotton",
            fit: "Oversized Fit",
            weight: "280 GSM",
            care: "Cold wash, iron low"
        }
    },
    {
        id: "life-through-my-lenses",
        slug: "life-through-my-lenses",
        name: "Life Through My Lenses",
        price: "Rs 1100",
        priceNum: 1100,
        image: "/images/landing-page/featured2.png",
        hoverImage: "/images/person-image-2-removebg-preview.png",
        sizes: ["S", "M", "L", "XL"],
        colors: [
            { name: "Beige", hex: "#F5F5DC", images: ["/images/landing-page/featured2.png"] }
        ],
        tag: "Techies",
        rating: "4.7",
        reviewsCount: 35,
        categoryId: "t-shirts",
        categorySlug: "t-shirts",
        categoryName: "T-Shirts",
        collectionId: "wonderlust",
        collectionSlug: "wonderlust",
        collectionName: "Wanderlust Collection",
        subCategoryId: "techies",
        subCategorySlug: "techies",
        subCategoryName: "Techies",
        link: "/products/life-through-my-lenses",
        description: "For digital nomads and tech visionaries. Heavyweight drop-shoulder tee with high-density minimalist graphic print.",
        details: {
            material: "100% Organic Cotton",
            fit: "Oversized Fit",
            weight: "280 GSM",
            care: "Cold wash, iron low"
        }
    },
    {
        id: "lost-on-purpose",
        slug: "lost-on-purpose",
        name: "Lost on Purpose",
        price: "Rs 1100",
        priceNum: 1100,
        image: "/images/landing-page/featured3.png",
        hoverImage: "/images/person-image-3-removebg-preview.png",
        sizes: ["S", "M", "L", "XL"],
        colors: [
            { name: "Olive", hex: "#556B2F", images: ["/images/landing-page/featured3.png"] }
        ],
        tag: "Nomad",
        rating: "4.9",
        reviewsCount: 58,
        categoryId: "t-shirts",
        categorySlug: "t-shirts",
        categoryName: "T-Shirts",
        collectionId: "wonderlust",
        collectionSlug: "wonderlust",
        collectionName: "Wanderlust Collection",
        subCategoryId: "nomad",
        subCategorySlug: "nomad",
        subCategoryName: "Nomad",
        link: "/products/lost-on-purpose",
        description: "Designed for wanderers and nomads. Heavy drop-shoulder tee built for comfort and style everywhere.",
        details: {
            material: "100% Organic Cotton",
            fit: "Oversized Fit",
            weight: "280 GSM",
            care: "Cold wash, iron low"
        }
    },
    {
        id: "miles-over-words",
        slug: "miles-over-words",
        name: "Miles Over Words",
        price: "Rs 1100",
        priceNum: 1100,
        image: "/images/landing-page/featured1.png",
        hoverImage: "/images/person-image-1-removebg-preview.png",
        sizes: ["S", "M", "L", "XL"],
        colors: [
            { name: "Black", hex: "#000000", images: ["/images/landing-page/featured1.png"] }
        ],
        tag: "Bikers",
        rating: "4.6",
        reviewsCount: 29,
        categoryId: "t-shirts",
        categorySlug: "t-shirts",
        categoryName: "T-Shirts",
        collectionId: "wonderlust",
        collectionSlug: "wonderlust",
        collectionName: "Wanderlust Collection",
        subCategoryId: "bikers",
        subCategorySlug: "bikers",
        subCategoryName: "Bikers",
        link: "/products/miles-over-words",
        description: "Built for riders who let actions speak louder than words. Durable, breathable heavyweight tee.",
        details: {
            material: "100% Organic Cotton",
            fit: "Oversized Fit",
            weight: "280 GSM",
            care: "Cold wash, iron low"
        }
    }
];

export function getFallbackProduct(idOrSlug) {
    if (!idOrSlug) return defaultProducts[0];
    const match = defaultProducts.find(
        p => p.id === idOrSlug || p.slug === idOrSlug || p.name.toLowerCase() === idOrSlug.toLowerCase()
    );
    return match || defaultProducts[0];
}
