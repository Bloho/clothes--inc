const categories = [
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

const wardrobe = [
  {
    name: "White Box Tee",
    brand: "Uniform",
    color: "White",
    category: "T-Shirts",
    image: "assets/white-tee.png",
  },
  {
    name: "Charcoal Box Tee",
    brand: "Uniform",
    color: "Charcoal",
    category: "T-Shirts",
    image: "assets/charcoal-tee.png",
  },
  {
    name: "Navy Box Tee",
    brand: "Uniform",
    color: "Navy",
    category: "T-Shirts",
    image: "assets/navy-tee.png",
  },
  {
    name: "Hanging Oxford",
    brand: "Checks",
    color: "Pale Blue",
    category: "Button Downs",
    image: "assets/striped-shirt.png",
  },
  {
    name: "Powder Button Down",
    brand: "Checks",
    color: "Blue",
    category: "Button Downs",
    image: "assets/powder-shirt.png",
  },
  {
    name: "Silver Button Down",
    brand: "Checks",
    color: "Silver",
    category: "Button Downs",
    image: "assets/silver-shirt.png",
  },
  {
    name: "Ivory Button Down",
    brand: "Checks",
    color: "Ivory",
    category: "Button Downs",
    image: "assets/ivory-shirt.png",
  },
  {
    name: "Denim Button Down",
    brand: "Checks",
    color: "Washed Blue",
    category: "Button Downs",
    image: "assets/denim-shirt.png",
  },
  {
    name: "Linen Shirt",
    brand: "Checks",
    color: "Bone",
    category: "Button Downs",
    image: "assets/linen-shirt.png",
  },
  {
    name: "Grey Turtleneck",
    brand: "Knitwear",
    color: "Slate",
    category: "Sweaters",
    image: "assets/grey-turtleneck.png",
  },
  {
    name: "Taupe Knit",
    brand: "Knitwear",
    color: "Taupe",
    category: "Sweaters",
    image: "assets/taupe-knit.png",
  },
  {
    name: "Black Quarter Zip",
    brand: "Knitwear",
    color: "Black",
    category: "Sweaters",
    image: "assets/black-quarterzip.png",
  },
  {
    name: "Black Mockneck",
    brand: "Knitwear",
    color: "Black",
    category: "Sweaters",
    image: "assets/black-mockneck.png",
  },
  {
    name: "Heather Stripe",
    brand: "Knitwear",
    color: "Grey",
    category: "Sweaters",
    image: "assets/heather-stripe.png",
  },
  {
    name: "Ink Crewneck",
    brand: "Knitwear",
    color: "Ink",
    category: "Sweaters",
    image: "assets/ink-crewneck.png",
  },
  {
    name: "Charcoal Longsleeve",
    brand: "Knitwear",
    color: "Charcoal",
    category: "Sweaters",
    image: "assets/charcoal-longsleeve.png",
  },
  {
    name: "Blue Longsleeve",
    brand: "Knitwear",
    color: "Navy",
    category: "Sweaters",
    image: "assets/blue-longsleeve.png",
  },
  {
    name: "Ash Longsleeve",
    brand: "Knitwear",
    color: "Ash",
    category: "Sweaters",
    image: "assets/ash-longsleeve.png",
  },
  {
    name: "Black Hoodie",
    brand: "Fleece",
    color: "Black",
    category: "Sweaters",
    image: "assets/black-hoodie.png",
  },
  {
    name: "Cobalt Hoodie",
    brand: "Fleece",
    color: "Cobalt",
    category: "Sweaters",
    image: "assets/cobalt-hoodie.png",
  },
  {
    name: "Raw Denim",
    brand: "Five Pocket",
    color: "Indigo",
    category: "Pants",
    image: "assets/raw-denim.png",
  },
  {
    name: "Washed Denim",
    brand: "Five Pocket",
    color: "Vintage Blue",
    category: "Pants",
    image: "assets/washed-denim.png",
  },
  {
    name: "Canvas Pants",
    brand: "Workwear",
    color: "Natural",
    category: "Pants",
    image: "assets/canvas-pants.png",
  },
  {
    name: "Black Field Shorts",
    brand: "Checks",
    color: "Black",
    category: "Shorts",
    image: "assets/black-shorts.png",
  },
  {
    name: "Hakama Jorts",
    brand: "Checks",
    color: "Indigo",
    category: "Shorts",
    image: "assets/hakama-jorts.png",
  },
  {
    name: "Canvas Tote",
    brand: "Utility",
    color: "Natural",
    category: "Bags",
    image: "assets/canvas-bag.png",
  },
  {
    name: "Boston Cap",
    brand: "Ballcap",
    color: "Cream",
    category: "Hats",
    image: "assets/boston-cap.png",
  },
  {
    name: "Camo Cap",
    brand: "Ballcap",
    color: "Camo",
    category: "Hats",
    image: "assets/camo-cap.png",
  },
  {
    name: "Eagle Cap",
    brand: "Ballcap",
    color: "Smoke",
    category: "Hats",
    image: "assets/eagle-cap.png",
  },
  {
    name: "Logo Cap",
    brand: "Ballcap",
    color: "Black",
    category: "Hats",
    image: "assets/black-logo-cap.png",
  },
  {
    name: "Black Beanie",
    brand: "Headwear",
    color: "Black",
    category: "Hats",
    image: "assets/black-beanie.png",
  },
  {
    name: "Round Frames",
    brand: "Optical",
    color: "Clear",
    category: "Accessories",
    image: "assets/round-frames.png",
  },
];

const app = document.querySelector("#app");
const categoryList = document.querySelector("#categoryList");
const grid = document.querySelector("#wardrobeGrid");
const overlay = document.querySelector("#detailOverlay");
const detailCard = document.querySelector(".detail-card");
const detailImage = document.querySelector("#detailImage");
const detailTitle = document.querySelector("#detailTitle");
const detailBrand = document.querySelector("#detailBrand");
const detailColor = document.querySelector("#detailColor");
const previousButton = document.querySelector(".nav-arrow--prev");
const nextButton = document.querySelector(".nav-arrow--next");

let activeIndex = 0;

function buildCategories() {
  const fragment = document.createDocumentFragment();

  categories.forEach((category) => {
    fragment.append(createCategoryButton(category));
  });

  categoryList.append(fragment);
}

function createCategoryButton(category) {
  const item = document.createElement("span");
  item.className = "category-item";
  item.textContent = category;
  item.dataset.category = category;
  item.tabIndex = 0;
  return item;
}

function buildGrid() {
  const fragment = document.createDocumentFragment();

  wardrobe.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "item-card";
    button.dataset.index = index;
    button.dataset.category = item.category;
    button.setAttribute("aria-label", `${item.name}, ${item.color}`);

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    button.append(image);
    fragment.append(button);
  });

  grid.append(fragment);
}

function setCategory(category) {
  categoryList.classList.add("is-filtering");

  document.querySelectorAll(".category-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.category === category);
  });

  document.querySelectorAll(".item-card").forEach((card) => {
    const shouldDim = card.dataset.category !== category;
    card.classList.toggle("is-dimmed", shouldDim);
  });
}

function resetCategory() {
  categoryList.classList.remove("is-filtering");

  document.querySelectorAll(".category-item").forEach((item) => {
    item.classList.remove("is-active");
  });

  document.querySelectorAll(".item-card").forEach((card) => {
    card.classList.remove("is-dimmed");
  });
}

function openDetail(index) {
  activeIndex = index;
  renderDetail();
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  app.classList.add("is-muted");
  document.body.classList.add("modal-open");
  detailCard.focus({ preventScroll: true });
}

function closeDetail() {
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  app.classList.remove("is-muted");
  document.body.classList.remove("modal-open");
}

function renderDetail() {
  const item = wardrobe[activeIndex];
  detailImage.src = item.image;
  detailImage.alt = item.name;
  detailTitle.textContent = item.name;
  detailBrand.textContent = item.brand;
  detailColor.textContent = item.color;
}

function moveDetail(step) {
  activeIndex = (activeIndex + step + wardrobe.length) % wardrobe.length;
  renderDetail();
}

categoryList.addEventListener("pointerover", (event) => {
  const item = event.target.closest(".category-item");
  if (!item) return;
  setCategory(item.dataset.category);
});

categoryList.addEventListener("pointerleave", () => {
  resetCategory();
});

categoryList.addEventListener("focusin", (event) => {
  const item = event.target.closest(".category-item");
  if (!item) return;
  setCategory(item.dataset.category);
});

categoryList.addEventListener("focusout", () => {
  window.setTimeout(() => {
    if (!categoryList.contains(document.activeElement)) {
      resetCategory();
    }
  }, 0);
});

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".item-card");
  if (!card) return;
  openDetail(Number(card.dataset.index));
});

overlay.addEventListener("click", (event) => {
  if (event.target.matches(".overlay-hitarea")) {
    closeDetail();
  }
});

previousButton.addEventListener("click", () => moveDetail(-1));
nextButton.addEventListener("click", () => moveDetail(1));

document.addEventListener("keydown", (event) => {
  if (!overlay.classList.contains("is-open")) return;

  if (event.key === "Escape") closeDetail();
  if (event.key === "ArrowLeft") moveDetail(-1);
  if (event.key === "ArrowRight") moveDetail(1);
});

buildCategories();
buildGrid();
