// Database of products matching local images and layout specs
export const allProducts = [
    {
        id: "lost-on-purpose-1",
        name: "Lost on Purpose",
        price: "Rs 1,100",
        priceNum: 1100,
        image: "/images/landing-page/featured3.png",
        tag: "Biker Series",
        rating: "4.7",
        reviewsCount: 63,
        description: "The Lost on Purpose tee from the Biker Series is more than a garment - it's a declaration. Crafted for those who ride with intention and live without a map, this heavy-weight drop-shoulder tee features original artwork inspired by the raw energy of street motorcycling. 100% ring-spun cotton. Washed for character. Worn for stories.",
        details: {
            material: "100% Ringspun Cotton",
            fit: "Oversized Drop Shoulder",
            weight: "280 GSM",
            care: "Cold wash, hang dry"
        },
        colors: [
            { name: "Raw Cream", hex: "#EADCC9" },
            { name: "Maroon", hex: "#5C1D24" },
            { name: "Black", hex: "#1A1A1A" }
        ],
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        reviews: [
            {
                author: "Arjun M.",
                rating: 5,
                date: "June 2026",
                text: "This tee is everything. The graphic is insane quality and the weight of the fabric feels premium. Already ordered two more. Can't wait."
            },
            {
                author: "Priya S.",
                rating: 4,
                date: "June 2026",
                text: "Great oversized fit and the wash gives it that lived-in texture. Runs slightly large, which I actually love. Wash care instructions are spot on."
            },
            {
                author: "Kabir R.",
                rating: 4,
                date: "June 2026",
                text: "The Biker Series concept is brilliant. This isn't just a t-shirt — it's a piece of art that starts conversations. Will definitely be back for more."
            }
        ]
    },
    {
        id: "miles-over-words-1",
        name: "Miles Over Words",
        price: "Rs 1,090",
        priceNum: 1090,
        image: "/images/landing-page/biker-tshirt.png",
        tag: "Biker Series",
        rating: "4.8",
        reviewsCount: 42,
        description: "Focus on the journey, not the destination. The Miles Over Words tee features a rugged motorcycle layout combined with modern calligraphy. Built with premium materials to resist long rides and multiple washes while retaining its shape and graphic details.",
        details: {
            material: "100% Cotton",
            fit: "Relaxed Boxy Fit",
            weight: "240 GSM",
            care: "Machine wash cold, line dry"
        },
        colors: [
            { name: "Midnight Black", hex: "#111111" },
            { name: "Petrol Blue", hex: "#1A2E40" },
            { name: "Slate Grey", hex: "#4A4A4A" }
        ],
        sizes: ["S", "M", "L", "XL", "XXL"],
        reviews: [
            {
                author: "Rohan K.",
                rating: 5,
                date: "May 2026",
                text: "Awesome graphic! Fits very comfortably. The black doesn't fade after washing, which is super rare."
            },
            {
                author: "Vikram S.",
                rating: 4,
                date: "June 2026",
                text: "Very cool design, matches my bike perfectly. The print is high quality."
            }
        ]
    },
    {
        id: "coding-tshirt-1",
        name: "Coding T-Shirt",
        price: "Rs 990",
        priceNum: 990,
        image: "/images/landing-page/coding-tshirt.png",
        tag: "Coding Series",
        rating: "4.9",
        reviewsCount: 128,
        description: "A tribute to programmers and software developers who build the world line by line. Features a minimalist code-based design. Extremely soft, breathable fabric ensures comfort during long, intense coding sessions.",
        details: {
            material: "100% Combed Cotton",
            fit: "Regular Fit",
            weight: "200 GSM",
            care: "Cold wash, iron inside out"
        },
        colors: [
            { name: "Dark Carbon", hex: "#1C1C1C" },
            { name: "Pure White", hex: "#FFFFFF" }
        ],
        sizes: ["XS", "S", "M", "L", "XL"],
        reviews: [
            {
                author: "Nisha G.",
                rating: 5,
                date: "June 2026",
                text: "Software engineer's dream tee! The fabric is so soft it keeps me comfortable even during late night deploys."
            },
            {
                author: "Devansh P.",
                rating: 5,
                date: "June 2026",
                text: "Clean layout, fits perfectly. Got multiple compliments from teammates."
            }
        ]
    },
    {
        id: "built-in-public-1",
        name: "Built in Public",
        price: "Rs 1,200",
        priceNum: 1200,
        image: "/images/landing-page/featured11.png",
        tag: "Coding Series",
        rating: "4.6",
        reviewsCount: 54,
        description: "Designed for creators and builders sharing their path openly. Features custom typographical design on heavy drop-shoulder cotton. Built to last through iterations and challenges.",
        details: {
            material: "100% Organic Cotton",
            fit: "Oversized Fit",
            weight: "280 GSM",
            care: "Cold wash, iron low"
        },
        colors: [
            { name: "Raw Cream", hex: "#E5DEC9" },
            { name: "Sand", hex: "#D2C9B1" },
            { name: "Ink Black", hex: "#151515" }
        ],
        sizes: ["S", "M", "L", "XL", "XXL"],
        reviews: [
            {
                author: "Aman T.",
                rating: 5,
                date: "April 2026",
                text: "The concept is amazing. Materials are really thick and feel premium. Definitely worth the price."
            }
        ]
    },
    {
        id: "life-through-lenses-1",
        name: "Life Through My Lenses",
        price: "Rs 1,100",
        priceNum: 1100,
        image: "/images/landing-page/featured2.png",
        tag: "Travel Series",
        rating: "4.7",
        reviewsCount: 31,
        description: "Capture the moment before it fades. The Life Through My Lenses tee features a subtle retro camera design. Ideal for travelers, photographers, and wanderers who appreciate visual storytelling.",
        details: {
            material: "80% Cotton, 20% Polyester",
            fit: "Standard Fit",
            weight: "220 GSM",
            care: "Tumble dry low, wash cold"
        },
        colors: [
            { name: "Sage Green", hex: "#5E7260" },
            { name: "Desert Sand", hex: "#DFD5C6" },
            { name: "Vintage White", hex: "#FAF5EF" }
        ],
        sizes: ["XS", "S", "M", "L", "XL"],
        reviews: [
            {
                author: "Siddharth B.",
                rating: 5,
                date: "May 2026",
                text: "Perfect travel tee. Light, comfortable, and the sage green color is very aesthetic."
            }
        ]
    },
    {
        id: "adventure-bound-1",
        name: "Adventure Bound",
        price: "Rs 1,150",
        priceNum: 1150,
        image: "/images/landing-page/featured3.png",
        tag: "Travel Series",
        rating: "4.5",
        reviewsCount: 19,
        description: "Ready for the open road. The Adventure Bound tee incorporates navigation-inspired layouts and graphics. Designed to accompany you on any trip or daily commute.",
        details: {
            material: "100% Cotton",
            fit: "Oversized Fit",
            weight: "260 GSM",
            care: "Cold wash, dry flat"
        },
        colors: [
            { name: "Warm Olive", hex: "#606A58" },
            { name: "Off-White", hex: "#FAF8F5" }
        ],
        sizes: ["S", "M", "L", "XL"],
        reviews: [
            {
                author: "Varun R.",
                rating: 4,
                date: "June 2026",
                text: "Good thick material, layout is crisp. Fits loose, so order a size down if you like regular fit."
            }
        ]
    },
    {
        id: "road-less-traveled-1",
        name: "Road Less Traveled",
        price: "Rs 1,050",
        priceNum: 1050,
        image: "/images/landing-page/biker-tshirt.png",
        tag: "Biker Series",
        rating: "4.8",
        reviewsCount: 88,
        description: "Choose the path of adventure. RLT incorporates dynamic retro lines and a screen-printed motorcycle vector. Comfortable, durable, and highly breathable.",
        details: {
            material: "100% Combed Cotton",
            fit: "Regular Boxy Fit",
            weight: "220 GSM",
            care: "Cold wash, warm iron"
        },
        colors: [
            { name: "Shadow Black", hex: "#1C1C1C" },
            { name: "Asphalt Grey", hex: "#5C5C5C" }
        ],
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        reviews: [
            {
                author: "Simran K.",
                rating: 5,
                date: "June 2026",
                text: "Really neat design. Fabric is heavy and feels durable. Highly recommend."
            }
        ]
    },
    {
        id: "hello-world-tee-1",
        name: "Hello World Tee",
        price: "Rs 950",
        priceNum: 950,
        image: "/images/landing-page/coding-tshirt.png",
        tag: "Coding Series",
        rating: "4.7",
        reviewsCount: 72,
        description: "The classic programmer greeting rendered in an artistic terminal display format. Made with high quality cotton that feels light and cool on skin.",
        details: {
            material: "100% Ringspun Cotton",
            fit: "Regular Fit",
            weight: "180 GSM",
            care: "Wash cold, hang dry"
        },
        colors: [
            { name: "Code Black", hex: "#000000" },
            { name: "Matrix Green", hex: "#2E3B2F" }
        ],
        sizes: ["S", "M", "L", "XL"],
        reviews: [
            {
                author: "Ananya S.",
                rating: 5,
                date: "March 2026",
                text: "Super cute and matches everything. The print has stayed perfect after several washes."
            }
        ]
    },
    {
        id: "byte-me-tshirt-1",
        name: "Byte Me T-Shirt",
        price: "Rs 990",
        priceNum: 990,
        image: "/images/landing-page/featured11.png",
        tag: "Coding Series",
        rating: "4.9",
        reviewsCount: 110,
        description: "A funny and geeky play on words for tech enthusiasts. Features binary-style decorative print on standard relaxed cotton.",
        details: {
            material: "100% Cotton",
            fit: "Relaxed Fit",
            weight: "200 GSM",
            care: "Cold wash, iron inside out"
        },
        colors: [
            { name: "Cyber Navy", hex: "#1B2A4A" },
            { name: "Deep Charcoal", hex: "#2C2C2C" }
        ],
        sizes: ["S", "M", "L", "XL", "XXL"],
        reviews: [
            {
                author: "Pranav M.",
                rating: 5,
                date: "June 2026",
                text: "A huge hit at my office. Extremely comfortable!"
            }
        ]
    },
    {
        id: "wanderlust-oversized-1",
        name: "Wanderlust Oversized",
        price: "Rs 1,250",
        priceNum: 1250,
        image: "/images/landing-page/featured2.png",
        tag: "Travel Series",
        rating: "4.6",
        reviewsCount: 45,
        description: "For the souls who wander without bounds. This extra-heavy drop-shoulder tee features typographic adventure quotes and clean photographic prints.",
        details: {
            material: "100% Organic Ringspun Cotton",
            fit: "Oversized Drop Shoulder",
            weight: "320 GSM",
            care: "Wash inside out, cold wash"
        },
        colors: [
            { name: "Raw Cream", hex: "#ECE4D3" },
            { name: "Earthy Brown", hex: "#7E6E5A" }
        ],
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        reviews: [
            {
                author: "Divya R.",
                rating: 5,
                date: "May 2026",
                text: "So thick and comfortable. Perfect for flights and travel. Oversized fit is exactly what I wanted."
            }
        ]
    },
    {
        id: "born-to-ride-1",
        name: "Born to Ride",
        price: "Rs 1,190",
        priceNum: 1190,
        image: "/images/landing-page/biker-tshirt.png",
        tag: "Biker Series",
        rating: "4.7",
        reviewsCount: 56,
        description: "Engineered for bikers. A raw design emphasizing speed and movement. Uses specialized printing technology that remains breathable and flexible.",
        details: {
            material: "100% Combed Cotton",
            fit: "Regular Boxy Fit",
            weight: "240 GSM",
            care: "Wash cold with like colors"
        },
        colors: [
            { name: "Ink Black", hex: "#1A1A1A" },
            { name: "Rust Red", hex: "#8A2A2A" }
        ],
        sizes: ["S", "M", "L", "XL", "XXL"],
        reviews: [
            {
                author: "Karan D.",
                rating: 5,
                date: "June 2026",
                text: "Outstanding material. Keeps me cool under my riding jacket. 10/10."
            }
        ]
    },
    {
        id: "git-commit-tee-1",
        name: "Git Commit Tee",
        price: "Rs 990",
        priceNum: 990,
        image: "/images/landing-page/coding-tshirt.png",
        tag: "Coding Series",
        rating: "4.8",
        reviewsCount: 93,
        description: "Commit your code and push to prod. Displays visual git commit tree flow diagram on comfortable ringspun cotton.",
        details: {
            material: "100% Ringspun Cotton",
            fit: "Standard Fit",
            weight: "200 GSM",
            care: "Cold wash, iron inside out"
        },
        colors: [
            { name: "Dark Carbon", hex: "#1B1B1B" },
            { name: "Heather Grey", hex: "#7E858B" }
        ],
        sizes: ["S", "M", "L", "XL"],
        reviews: [
            {
                author: "Kriti S.",
                rating: 5,
                date: "May 2026",
                text: "Really love the graphical git tree concept. Excellent build quality, and wash care is simple."
            }
        ]
    }
];

export function getProductById(id) {
    // Dynamic match or fallback to default
    const matched = allProducts.find((p) => p.id === id);
    if (matched) return matched;
    
    // Support landing page non-suffixed IDs
    const alternative = allProducts.find((p) => p.id.replace("-1", "") === id);
    if (alternative) return alternative;
    
    // Default fallback
    return allProducts[0];
}
