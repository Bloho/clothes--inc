export const categories = [
  "T-Shirts",
  "Button Downs",
  "Sweaters",
  "Pants",
  "Jackets",
  "Coats",
  "Shorts",
  "Hats",
  "Accessories",
  "Shoes",
  "Bags",
  "Activewear",
];

export function isValidCategory(category) {
  return categories.includes(category);
}
