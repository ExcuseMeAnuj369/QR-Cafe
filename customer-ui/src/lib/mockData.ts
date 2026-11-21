import type { MenuItem } from './types';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: "item-samosa",
    name: {
      en: "Crispy Punjabi Samosas (2 pcs)",
      hi: "पंजाबी समोसे (2 पीस)",
      mr: "पंजाबी समोसे (2 नग)"
    },
    desc: {
      en: "Spiced potato and peas wrapped in flaky pastry with mint and tamarind chutneys.",
      hi: "मसालेदार आलू और मटर से भरे कुरकुरे समोसे हरी और मीठी चटनी के साथ।",
      mr: "मसालेदार बटाटा आणि मटार भरलेले कुरकुरीत समोसे चटणीसोबत."
    },
    price: 9000, // ₹90.00
    category: "starters",
    veg: true,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
    stock: 25,
    sold_out: false,
    spice_allowed: true,
    tags: ["bestseller"],
    addons: [
      {
        id: "add-chutney",
        name: { en: "Extra Mint Chutney", hi: "अतिरिक्त पुदीना चटनी", mr: "जादा पुदिना चटणी" },
        price: 2000
      }
    ]
  },
  {
    id: "item-paneer-tikka",
    name: {
      en: "Tandoori Paneer Tikka",
      hi: "तंदूरी पनीर टिक्का",
      mr: "तंदुरी पनीर टिक्का"
    },
    desc: {
      en: "Cottage cheese marinated in Kashmiri spices, skewered and grilled over charcoal.",
      hi: "कश्मीरी मसालों में लिपटा पनीर, कोयले पर सिका हुआ।",
      mr: "कोळशावर भाजलेले खमंग पनीर टिक्के."
    },
    price: 28000, // ₹280.00
    category: "starters",
    veg: true,
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
    stock: 14,
    sold_out: false,
    spice_allowed: true,
    tags: ["bestseller"],
    addons: [
      {
        id: "add-cheese",
        name: { en: "Extra Cheese Melt", hi: "चीज़ मेल्ट", mr: "चीज मेल्ट" },
        price: 4000
      }
    ]
  },
  {
    id: "item-butter-chicken",
    name: {
      en: "Classic Butter Chicken",
      hi: "क्लासिक बटर चिकन",
      mr: "क्लासिक बटर चिकन"
    },
    desc: {
      en: "Tender chicken cooked in rich satin tomato and makhani gravy with butter glaze.",
      hi: "मखमली टमाटर और मक्खन की ग्रेवी में पका स्वादिष्ट चिकन।",
      mr: "मखनी ग्रेव्हीमध्ये शिजवलेले चिकन."
    },
    price: 38000, // ₹380.00
    category: "mains",
    veg: false,
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
    stock: 8,
    sold_out: false,
    spice_allowed: true,
    tags: ["bestseller"],
    addons: [
      {
        id: "add-gravy",
        name: { en: "Extra Butter Gravy", hi: "अतिरिक्त बटर ग्रेवी", mr: "जादा बटर ग्रेव्ही" },
        price: 5000
      }
    ]
  },
  {
    id: "item-dal-makhani",
    name: {
      en: "Dal Makhani Handi",
      hi: "दाल मखनी हांडी",
      mr: "दाल मखनी हांडी"
    },
    desc: {
      en: "Black lentils slow-cooked overnight with white butter, cream, and aromatic spices.",
      hi: "रात भर धीमी आंच पर पकाई गई काली दाल मक्खन और क्रीम के साथ।",
      mr: "रात्रभर मंद आचेवर शिजवलेली काळी डाळ."
    },
    price: 24000, // ₹240.00
    category: "mains",
    veg: true,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
    stock: 20,
    sold_out: false,
    spice_allowed: false,
    tags: [],
    addons: [
      {
        id: "add-butter",
        name: { en: "Desi Butter Dollop", hi: "देसी मक्खन", mr: "देशी लोणी" },
        price: 2500
      }
    ]
  },
  {
    id: "item-butter-naan",
    name: {
      en: "Butter Garlic Naan",
      hi: "बटर गार्लिक नान",
      mr: "बटर गार्लिक नान"
    },
    desc: {
      en: "Soft clay-oven baked bread infused with minced garlic and coriander butter.",
      hi: "लहसुन और मक्खन से भरपूर तंदूरी नान।",
      mr: "लसूण आणि लोणी लावलेली तंदुरी नान."
    },
    price: 6500, // ₹65.00
    category: "breads",
    veg: true,
    image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
    stock: 50,
    sold_out: false,
    spice_allowed: false,
    tags: [],
    addons: []
  },
  {
    id: "item-dum-biryani",
    name: {
      en: "Awadhi Dum Biryani",
      hi: "अवधी दम बिरयानी",
      mr: "अवधी दम बिर्याणी"
    },
    desc: {
      en: "Long-grain basmati rice layered with saffron, fragrant spices, and slow-dum sealed.",
      hi: "केसर और सुगंधित मसालों के साथ दम में पकी बासमती बिरयानी।",
      mr: "केसर आणि मसाल्यात शिजवलेली दम बिर्याणी."
    },
    price: 32000, // ₹320.00
    category: "mains",
    veg: true,
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
    stock: 5,
    sold_out: false,
    spice_allowed: true,
    tags: ["bestseller"],
    addons: [
      {
        id: "add-raita",
        name: { en: "Boondi Raita Bowl", hi: "बूंदी रायता", mr: "बुंदी रायता" },
        price: 4000
      }
    ]
  },
  {
    id: "item-gulab-jamun",
    name: {
      en: "Warm Gulab Jamun with Rabri",
      hi: "गुलाब जामुन रबड़ी के साथ",
      mr: "गुलाब जामुन रबडीसोबत"
    },
    desc: {
      en: "Golden fried milk spheres soaked in cardamom sugar syrup, served with thick rabri.",
      hi: "इलायची की चाशनी में डूबे गुलाब जामुन गाढ़ी रबड़ी के साथ।",
      mr: "वेलची पाकातील गुलाबजाम रबडीसोबत."
    },
    price: 14000, // ₹140.00
    category: "desserts",
    veg: true,
    image: "https://images.unsplash.com/photo-1593701461250-d7b22dfd3a77?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
    stock: 18,
    sold_out: false,
    spice_allowed: false,
    tags: ["bestseller"],
    addons: []
  },
  {
    id: "item-mango-lassi",
    name: {
      en: "Royal Alphonso Mango Lassi",
      hi: "शाही अल्फांसो मैंगो लस्सी",
      mr: "अल्फान्सो मँगो लस्सी"
    },
    desc: {
      en: "Thick churned sweet yogurt blended with Ratnagiri Alphonso pulp and pistachio flakes.",
      hi: "रत्नागिरी हापुस आम के पल्प और पिस्ता से बनी गाढ़ी लस्सी।",
      mr: "हापूस आंब्याची घट्ट आणि गोड लस्सी."
    },
    price: 12000, // ₹120.00
    category: "drinks",
    veg: true,
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
    stock: 30,
    sold_out: false,
    spice_allowed: false,
    tags: [],
    addons: []
  },
  {
    id: "item-kids-cheesy-fries",
    name: {
      en: "Kids Cheesy Crispy Bites",
      hi: "किड्स चीज़ी क्रिस्पी बाइट्स",
      mr: "किड्स चीझी बाईट्स"
    },
    desc: {
      en: "Mildly seasoned crispy potato smiles coated with golden cheddar dip.",
      hi: "बच्चों के लिए खास कम तीखे चीज़ी पोटैटो बाइट्स।",
      mr: "मुलांसाठी खास कुरकुरीत चीझ बाईट्स."
    },
    price: 11000, // ₹110.00
    category: "kids",
    veg: true,
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?crop=entropy&cs=srgb&fm=jpg&w=400&q=80",
    stock: 15,
    sold_out: false,
    spice_allowed: false,
    tags: [],
    addons: []
  }
];

