// Меню кафе AURA. Чтобы поменять цену или название — правьте только этот файл.
// price — цена в рублях, portion — размер порции, desc — состав (можно оставить пустым).

const CAFE = {
  name: "AURA",
  subtitle: "cafe lounge · Назрань",
  address: "г. Назрань, ул. Тангиева, 45",
  phone: "+7 913 706-06-06",
  phoneLink: "+79137060606",
  whatsapp: "79137060606",
  instagram: "https://instagram.com/aura_kafe_",
  // Время по Москве (в Ингушетии то же время)
  openFrom: "11:00",
  openTo: "00:00",
  ordersTo: "23:30",
};

const CATEGORIES = [
  { id: "hot", title: "Горячее" },
  { id: "salads", title: "Салаты" },
  { id: "rolls", title: "Роллы" },
];

const MENU = [
  { id: "goulash", cat: "hot", name: "Гуляш с картофельным пюре", desc: "", portion: "", price: 590, img: "img/goulash.webp" },
  { id: "jiz", cat: "hot", name: "Джиз", desc: "", portion: "", price: 630, img: "img/jiz.webp" },
  { id: "khachapuri", cat: "hot", name: "Хачапури", desc: "", portion: "", price: 450, img: "img/khachapuri.webp" },

  { id: "caesar_chicken", cat: "salads", name: "Цезарь с курицей", desc: "", portion: "", price: 410, img: "img/caesar_chicken.webp" },
  { id: "caesar_shrimp", cat: "salads", name: "Цезарь с креветками", desc: "", portion: "", price: 490, img: "img/caesar_shrimp.webp" },
  { id: "warm_salad", cat: "salads", name: "Тёплый салат", desc: "", portion: "", price: 520, img: "img/warm_salad.webp" },

  { id: "roll_salmon", cat: "rolls", name: "Бешеный лосось", desc: "Нори, рис, сыр, огурец, лосось, крабовые палочки, соусы", portion: "8 шт", price: 550, img: "img/roll_salmon.webp" },
  { id: "roll_tempura", cat: "rolls", name: "Темпура краб", desc: "Нори, рис, сыр, огурец, крабовые палочки, кляр, сухари", portion: "8 шт", price: 450, img: "img/roll_tempura.webp" },
  { id: "roll_california", cat: "rolls", name: "Калифорния с лососем", desc: "Нори, рис, сыр, огурец, лосось, икра", portion: "8 шт", price: 590, img: "img/roll_california.webp" },
  { id: "roll_canada", cat: "rolls", name: "Канада с угрём", desc: "Сыр, огурец, рис, угорь, соус унаги, кунжут", portion: "8 шт", price: 650, img: "img/roll_canada.webp" },
];

// Населённые пункты для подсказки в поле адреса
const TOWNS = [
  "Назрань", "Магас", "Карабулак", "Малгобек", "Сунжа", "Джейрах",
  "Экажево", "Сурхахи", "Плиево", "Кантышево", "Барсуки", "Яндаре",
  "Гамурзиево", "Насыр-Корт", "Альтиево", "Нижние Ачалуки", "Средние Ачалуки",
  "Верхние Ачалуки", "Вознесеновская", "Нестеровская", "Троицкая",
  "Орджоникидзевская", "Галашки", "Али-Юрт", "Долаково",
];
