export interface FluentFoodEmoji {
  id: string;
  name: string;
  nameAr: string;
  folder: string;
  fileBase: string;
  emoji: string;
  category: 'fast_food' | 'pizza_pasta' | 'drinks' | 'desserts' | 'grills' | 'salads' | 'seafood' | 'breakfast' | 'fruits_veggies';
}

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';

export const getFluentEmojiUrl = (item: FluentFoodEmoji, style: '3d' | 'color' | 'flat' | 'line'): string => {
  const encodedFolder = encodeURIComponent(item.folder);
  const base = item.fileBase;

  switch (style) {
    case '3d':
      return `${CDN_BASE}/${encodedFolder}/3D/${base}_3d.png`;
    case 'color':
      return `${CDN_BASE}/${encodedFolder}/Color/${base}_color.svg`;
    case 'flat':
      return `${CDN_BASE}/${encodedFolder}/Flat/${base}_flat.svg`;
    case 'line':
      return `${CDN_BASE}/${encodedFolder}/High%20Contrast/${base}_high_contrast.svg`;
    default:
      return `${CDN_BASE}/${encodedFolder}/3D/${base}_3d.png`;
  }
};

export const FLUENT_FOOD_EMOJIS: FluentFoodEmoji[] = [
  // ==========================================
  // 1. Fast Food & Sandwiches & Snacks
  // ==========================================
  { id: 'hamburger', name: 'Hamburger', nameAr: 'برجر', folder: 'Hamburger', fileBase: 'hamburger', emoji: '🍔', category: 'fast_food' },
  { id: 'french_fries', name: 'French Fries', nameAr: 'بطاطس مقلية', folder: 'French fries', fileBase: 'french_fries', emoji: '🍟', category: 'fast_food' },
  { id: 'hot_dog', name: 'Hot Dog', nameAr: 'هوت دوج', folder: 'Hot dog', fileBase: 'hot_dog', emoji: '🌭', category: 'fast_food' },
  { id: 'sandwich', name: 'Sandwich', nameAr: 'ساندويتش', folder: 'Sandwich', fileBase: 'sandwich', emoji: '🥪', category: 'fast_food' },
  { id: 'stuffed_flatbread', name: 'Falafel / Shawarma Pocket', nameAr: 'جيب فلافل وشاورما', folder: 'Stuffed flatbread', fileBase: 'stuffed_flatbread', emoji: '🥙', category: 'fast_food' },
  { id: 'taco', name: 'Taco', nameAr: 'تاكو', folder: 'Taco', fileBase: 'taco', emoji: '🌮', category: 'fast_food' },
  { id: 'burrito', name: 'Burrito', nameAr: 'بوريتو', folder: 'Burrito', fileBase: 'burrito', emoji: '🌯', category: 'fast_food' },
  { id: 'poultry_leg', name: 'Fried Chicken', nameAr: 'دجاج مقلي', folder: 'Poultry leg', fileBase: 'poultry_leg', emoji: '🍗', category: 'fast_food' },
  { id: 'flatbread', name: 'Shawarma / Flatbread', nameAr: 'شاورما / خبز', folder: 'Flatbread', fileBase: 'flatbread', emoji: '🫓', category: 'fast_food' },
  { id: 'popcorn', name: 'Popcorn & Snacks', nameAr: 'فشار وسناكات', folder: 'Popcorn', fileBase: 'popcorn', emoji: '🍿', category: 'fast_food' },
  { id: 'takeout_box', name: 'Takeout Box', nameAr: 'وجبات سفري وبوكسات', folder: 'Takeout box', fileBase: 'takeout_box', emoji: '🥡', category: 'fast_food' },

  // ==========================================
  // 2. Pizza & Pasta & Main Meals
  // ==========================================
  { id: 'pizza', name: 'Pizza Slice', nameAr: 'بيتزا', folder: 'Pizza', fileBase: 'pizza', emoji: '🍕', category: 'pizza_pasta' },
  { id: 'spaghetti', name: 'Spaghetti & Pasta', nameAr: 'سباغيتي / باستا', folder: 'Spaghetti', fileBase: 'spaghetti', emoji: '🍝', category: 'pizza_pasta' },
  { id: 'fork_and_knife_with_plate', name: 'Main Dish / Plate', nameAr: 'طبق رئيسي ووجبات', folder: 'Fork and knife with plate', fileBase: 'fork_and_knife_with_plate', emoji: '🍽️', category: 'pizza_pasta' },

  // ==========================================
  // 3. Grills & Steaks & Meats
  // ==========================================
  { id: 'cut_of_meat', name: 'Steak & Meat', nameAr: 'ستيك ولحوم', folder: 'Cut of meat', fileBase: 'cut_of_meat', emoji: '🥩', category: 'grills' },
  { id: 'meat_on_bone', name: 'Meat on Bone', nameAr: 'ريش ومشاوي', folder: 'Meat on bone', fileBase: 'meat_on_bone', emoji: '🍖', category: 'grills' },
  { id: 'bacon', name: 'Bacon', nameAr: 'بيكون مقدد', folder: 'Bacon', fileBase: 'bacon', emoji: '🥓', category: 'grills' },

  // ==========================================
  // 4. Asian, Seafood & Rice
  // ==========================================
  { id: 'fish', name: 'Fresh Fish', nameAr: 'سمك وبحريات', folder: 'Fish', fileBase: 'fish', emoji: '🐟', category: 'seafood' },
  { id: 'shrimp', name: 'Shrimp / Seafood', nameAr: 'روبيان وفواكه بحر', folder: 'Shrimp', fileBase: 'shrimp', emoji: '🦐', category: 'seafood' },
  { id: 'fried_shrimp', name: 'Fried Shrimp / Tempura', nameAr: 'جمبري مقلي / تمبورا', folder: 'Fried shrimp', fileBase: 'fried_shrimp', emoji: '🍤', category: 'seafood' },
  { id: 'crab', name: 'Crab', nameAr: 'سلطعون وكابوريا', folder: 'Crab', fileBase: 'crab', emoji: '🦀', category: 'seafood' },
  { id: 'lobster', name: 'Lobster', nameAr: 'إستاكوزا وكراكند', folder: 'Lobster', fileBase: 'lobster', emoji: '🦞', category: 'seafood' },
  { id: 'oyster', name: 'Oyster', nameAr: 'محار وبحريات فاخرة', folder: 'Oyster', fileBase: 'oyster', emoji: '🦪', category: 'seafood' },
  { id: 'sushi', name: 'Sushi Nigiri', nameAr: 'سوشي ياباني', folder: 'Sushi', fileBase: 'sushi', emoji: '🍣', category: 'seafood' },
  { id: 'steaming_bowl', name: 'Ramen Noodles', nameAr: 'نودلز / رامن', folder: 'Steaming bowl', fileBase: 'steaming_bowl', emoji: '🍜', category: 'seafood' },
  { id: 'cooked_rice', name: 'Rice Bowl', nameAr: 'أرز مطهو / صحن رز', folder: 'Cooked rice', fileBase: 'cooked_rice', emoji: '🍚', category: 'seafood' },
  { id: 'curry_rice', name: 'Curry Rice', nameAr: 'أرز بالكاري', folder: 'Curry rice', fileBase: 'curry_rice', emoji: '🍛', category: 'seafood' },
  { id: 'bento_box', name: 'Bento Box', nameAr: 'بينتو ياباني', folder: 'Bento box', fileBase: 'bento_box', emoji: '🍱', category: 'seafood' },
  { id: 'dumpling', name: 'Dumplings', nameAr: 'دامبلنغ وممبار', folder: 'Dumpling', fileBase: 'dumpling', emoji: '🥟', category: 'seafood' },

  // ==========================================
  // 5. Cafe, Drinks & Beverages
  // ==========================================
  { id: 'hot_beverage', name: 'Hot Coffee', nameAr: 'قهوة ساخنة وإسبريسو', folder: 'Hot beverage', fileBase: 'hot_beverage', emoji: '☕', category: 'drinks' },
  { id: 'bubble_tea', name: 'Bubble Tea / Boba', nameAr: 'بابل تي وماتشا', folder: 'Bubble tea', fileBase: 'bubble_tea', emoji: '🧋', category: 'drinks' },
  { id: 'glass_of_milk', name: 'Milk & Milkshakes', nameAr: 'حليب وميلك شيك', folder: 'Glass of milk', fileBase: 'glass_of_milk', emoji: '🥛', category: 'drinks' },
  { id: 'cup_with_straw', name: 'Cold Drink & Soda', nameAr: 'مشروب غازي وعصائر', folder: 'Cup with straw', fileBase: 'cup_with_straw', emoji: '🥤', category: 'drinks' },
  { id: 'tropical_drink', name: 'Tropical Mocktail', nameAr: 'كوكتيل منعش', folder: 'Tropical drink', fileBase: 'tropical_drink', emoji: '🍹', category: 'drinks' },
  { id: 'cocktail_glass', name: 'Cocktail Glass', nameAr: 'مشروب مثلج وسموذي', folder: 'Cocktail glass', fileBase: 'cocktail_glass', emoji: '🍸', category: 'drinks' },
  { id: 'wine_glass', name: 'Wine Glass', nameAr: 'مشروبات فاخرة وعصائر عنب', folder: 'Wine glass', fileBase: 'wine_glass', emoji: '🍷', category: 'drinks' },
  { id: 'beer_mug', name: 'Sparkling Drink', nameAr: 'موهيتو ومشروبات فوارة', folder: 'Beer mug', fileBase: 'beer_mug', emoji: '🍺', category: 'drinks' },
  { id: 'bottle_with_popping_cork', name: 'Celebration Drink', nameAr: 'مشروبات احتفالية وفوارة', folder: 'Bottle with popping cork', fileBase: 'bottle_with_popping_cork', emoji: '🍾', category: 'drinks' },
  { id: 'beverage_box', name: 'Juice Box', nameAr: 'عصير طبيعي معلب', folder: 'Beverage box', fileBase: 'beverage_box', emoji: '🧃', category: 'drinks' },
  { id: 'ice', name: 'Ice & Cold Brew', nameAr: 'مكعبات ثلج وكولد برو', folder: 'Ice', fileBase: 'ice', emoji: '🧊', category: 'drinks' },
  { id: 'teapot', name: 'Hot Teapot', nameAr: 'شاي وإبريق ضيافة', folder: 'Teapot', fileBase: 'teapot', emoji: '🫖', category: 'drinks' },
  { id: 'teacup_without_handle', name: 'Green Tea', nameAr: 'شاي أخضر وماتشا', folder: 'Teacup without handle', fileBase: 'teacup_without_handle', emoji: '🍵', category: 'drinks' },

  // ==========================================
  // 6. Desserts, Sweets & Ice Cream
  // ==========================================
  { id: 'birthday_cake', name: 'Birthday Cake', nameAr: 'تورتات وكيك مناسبات', folder: 'Birthday cake', fileBase: 'birthday_cake', emoji: '🎂', category: 'desserts' },
  { id: 'shortcake', name: 'Cake Slice', nameAr: 'كيك وحلويات', folder: 'Shortcake', fileBase: 'shortcake', emoji: '🍰', category: 'desserts' },
  { id: 'cupcake', name: 'Cupcake', nameAr: 'كب كيك ومافن', folder: 'Cupcake', fileBase: 'cupcake', emoji: '🧁', category: 'desserts' },
  { id: 'soft_ice_cream', name: 'Soft Ice Cream', nameAr: 'آيس كريم مخروط', folder: 'Soft ice cream', fileBase: 'soft_ice_cream', emoji: '🍦', category: 'desserts' },
  { id: 'ice_cream', name: 'Ice Cream Bowl', nameAr: 'بولات آيس كريم وجيلاتو', folder: 'Ice cream', fileBase: 'ice_cream', emoji: '🍨', category: 'desserts' },
  { id: 'shaved_ice', name: 'Shaved Ice / Granita', nameAr: 'جرانيتا وآيس سلاش', folder: 'Shaved ice', fileBase: 'shaved_ice', emoji: '🍧', category: 'desserts' },
  { id: 'doughnut', name: 'Doughnut', nameAr: 'دونات وسويتس', folder: 'Doughnut', fileBase: 'doughnut', emoji: '🍩', category: 'desserts' },
  { id: 'cookie', name: 'Cookie', nameAr: 'كوكيز وبسكويت', folder: 'Cookie', fileBase: 'cookie', emoji: '🍪', category: 'desserts' },
  { id: 'chocolate_bar', name: 'Chocolate Bar', nameAr: 'شوكولاتة فاخرة', folder: 'Chocolate bar', fileBase: 'chocolate_bar', emoji: '🍫', category: 'desserts' },
  { id: 'pancakes', name: 'Pancakes', nameAr: 'بان كيك', folder: 'Pancakes', fileBase: 'pancakes', emoji: '🥞', category: 'desserts' },
  { id: 'waffle', name: 'Waffle', nameAr: 'وافل مقرمش', folder: 'Waffle', fileBase: 'waffle', emoji: '🧇', category: 'desserts' },
  { id: 'pie', name: 'Pie & Tart', nameAr: 'فطيرة وتارت', folder: 'Pie', fileBase: 'pie', emoji: '🥧', category: 'desserts' },
  { id: 'custard', name: 'Flan / Pudding', nameAr: 'كاسترد وفلان وبودينغ', folder: 'Custard', fileBase: 'custard', emoji: '🍮', category: 'desserts' },
  { id: 'candy', name: 'Candy & Sweets', nameAr: 'سكاكر وحلوى', folder: 'Candy', fileBase: 'candy', emoji: '🍬', category: 'desserts' },
  { id: 'lollipop', name: 'Lollipop', nameAr: 'مصاصات وحلويات أطفال', folder: 'Lollipop', fileBase: 'lollipop', emoji: '🍭', category: 'desserts' },
  { id: 'honey_pot', name: 'Honey Pot', nameAr: 'عسل طبيعي وتغميسات', folder: 'Honey pot', fileBase: 'honey_pot', emoji: '🍯', category: 'desserts' },

  // ==========================================
  // 7. Breakfast, Bakery & Dairy
  // ==========================================
  { id: 'croissant', name: 'Croissant', nameAr: 'كرواسون فرنسي', folder: 'Croissant', fileBase: 'croissant', emoji: '🥐', category: 'breakfast' },
  { id: 'baguette_bread', name: 'French Baguette', nameAr: 'باغيت ومخبوزات صامولي', folder: 'Baguette bread', fileBase: 'baguette_bread', emoji: '🥖', category: 'breakfast' },
  { id: 'bagel', name: 'Bagel', nameAr: 'بيغل', folder: 'Bagel', fileBase: 'bagel', emoji: '🥯', category: 'breakfast' },
  { id: 'bread', name: 'Bread Loaf', nameAr: 'خبز طازج وتوست', folder: 'Bread', fileBase: 'bread', emoji: '🍞', category: 'breakfast' },
  { id: 'pretzel', name: 'Pretzel', nameAr: 'بريتزل ألماني', folder: 'Pretzel', fileBase: 'pretzel', emoji: '🥨', category: 'breakfast' },
  { id: 'cooking', name: 'Fried Egg', nameAr: 'بيض ومقليات وشكشوكة', folder: 'Cooking', fileBase: 'cooking', emoji: '🍳', category: 'breakfast' },
  { id: 'egg', name: 'Fresh Egg', nameAr: 'بيض طازج ومسلوق', folder: 'Egg', fileBase: 'egg', emoji: '🥚', category: 'breakfast' },
  { id: 'cheese_wedge', name: 'Cheese Wedge', nameAr: 'أجبان فاخرة', folder: 'Cheese wedge', fileBase: 'cheese_wedge', emoji: '🧀', category: 'breakfast' },
  { id: 'butter', name: 'Butter', nameAr: 'زبدة وقشطة', folder: 'Butter', fileBase: 'butter', emoji: '🧈', category: 'breakfast' },
  { id: 'bowl_with_spoon', name: 'Soup & Oats', nameAr: 'شوربة وحساء وشوفان', folder: 'Bowl with spoon', fileBase: 'bowl_with_spoon', emoji: '🥣', category: 'breakfast' },

  // ==========================================
  // 8. Healthy, Salads, Vegetables & Sauces
  // ==========================================
  { id: 'green_salad', name: 'Green Salad', nameAr: 'سلطة خضراء وطازجة', folder: 'Green salad', fileBase: 'green_salad', emoji: '🥗', category: 'salads' },
  { id: 'pot_of_food', name: 'Traditional Stew', nameAr: 'طاجين وإيدام وحساء', folder: 'Pot of food', fileBase: 'pot_of_food', emoji: '🍲', category: 'salads' },
  { id: 'avocado', name: 'Avocado', nameAr: 'أفوكادو صحي وجواكامولي', folder: 'Avocado', fileBase: 'avocado', emoji: '🥑', category: 'salads' },
  { id: 'tomato', name: 'Tomato & Sauce', nameAr: 'طماطم وصلصات', folder: 'Tomato', fileBase: 'tomato', emoji: '🍅', category: 'salads' },
  { id: 'cucumber', name: 'Cucumber & Pickles', nameAr: 'خيار ومخللات', folder: 'Cucumber', fileBase: 'cucumber', emoji: '🥒', category: 'salads' },
  { id: 'broccoli', name: 'Broccoli', nameAr: 'بروكلي وخضار سوتيه', folder: 'Broccoli', fileBase: 'broccoli', emoji: '🥦', category: 'salads' },
  { id: 'carrot', name: 'Carrot', nameAr: 'جزر ومقبلات', folder: 'Carrot', fileBase: 'carrot', emoji: '🥕', category: 'salads' },
  { id: 'mushroom', name: 'Mushroom', nameAr: 'فطر ومشروم', folder: 'Mushroom', fileBase: 'mushroom', emoji: '🍄', category: 'salads' },
  { id: 'olive', name: 'Olive', nameAr: 'زيتون ومقبلات زيتية', folder: 'Olive', fileBase: 'olive', emoji: '🫒', category: 'salads' },
  { id: 'bell_pepper', name: 'Bell Pepper', nameAr: 'فلفل رومي وألوان', folder: 'Bell pepper', fileBase: 'bell_pepper', emoji: '🫑', category: 'salads' },
  { id: 'ear_of_corn', name: 'Corn on Cob', nameAr: 'ذرة مشوية وسناك', folder: 'Ear of corn', fileBase: 'ear_of_corn', emoji: '🌽', category: 'salads' },
  { id: 'potato', name: 'Potato', nameAr: 'بطاطس مشوية وبيوريه', folder: 'Potato', fileBase: 'potato', emoji: '🥔', category: 'salads' },
  { id: 'peanuts', name: 'Peanuts & Nuts', nameAr: 'مكسرات ومقبلات', folder: 'Peanuts', fileBase: 'peanuts', emoji: '🥜', category: 'salads' },
  { id: 'salt', name: 'Salt & Spices', nameAr: 'بهارات وتوابل وملح', folder: 'Salt', fileBase: 'salt', emoji: '🧂', category: 'salads' },
  { id: 'canned_food', name: 'Canned Food & Sauces', nameAr: 'صلصات ومعلبات', folder: 'Canned food', fileBase: 'canned_food', emoji: '🥫', category: 'salads' },

  // ==========================================
  // 9. Fruits & Fresh Juices
  // ==========================================
  { id: 'strawberry', name: 'Strawberry', nameAr: 'فراولة طازجة', folder: 'Strawberry', fileBase: 'strawberry', emoji: '🍓', category: 'fruits_veggies' },
  { id: 'blueberries', name: 'Blueberries', nameAr: 'توت بري وبلوبيري', folder: 'Blueberries', fileBase: 'blueberries', emoji: '🫐', category: 'fruits_veggies' },
  { id: 'cherries', name: 'Cherries', nameAr: 'كرز وتوت أحمر', folder: 'Cherries', fileBase: 'cherries', emoji: '🍒', category: 'fruits_veggies' },
  { id: 'lemon', name: 'Lemon', nameAr: 'ليمون وحمضيات', folder: 'Lemon', fileBase: 'lemon', emoji: '🍋', category: 'fruits_veggies' },
  { id: 'orange', name: 'Orange', nameAr: 'برتقال ويوسفي', folder: 'Tangerine', fileBase: 'tangerine', emoji: '🍊', category: 'fruits_veggies' },
  { id: 'banana', name: 'Banana', nameAr: 'موز', folder: 'Banana', fileBase: 'banana', emoji: '🍌', category: 'fruits_veggies' },
  { id: 'pineapple', name: 'Pineapple', nameAr: 'أناناس استوائي', folder: 'Pineapple', fileBase: 'pineapple', emoji: '🍍', category: 'fruits_veggies' },
  { id: 'mango', name: 'Mango', nameAr: 'مانجو طازجة', folder: 'Mango', fileBase: 'mango', emoji: '🥭', category: 'fruits_veggies' },
  { id: 'watermelon', name: 'Watermelon', nameAr: 'بطيخ منعش', folder: 'Watermelon', fileBase: 'watermelon', emoji: '🍉', category: 'fruits_veggies' },
  { id: 'red_apple', name: 'Red Apple', nameAr: 'تفاح أحمر', folder: 'Red apple', fileBase: 'red_apple', emoji: '🍎', category: 'fruits_veggies' },
  { id: 'green_apple', name: 'Green Apple', nameAr: 'تفاح أخضر', folder: 'Green apple', fileBase: 'green_apple', emoji: '🍏', category: 'fruits_veggies' },
  { id: 'grapes', name: 'Grapes', nameAr: 'عنب طازج', folder: 'Grapes', fileBase: 'grapes', emoji: '🍇', category: 'fruits_veggies' },
  { id: 'peach', name: 'Peach', nameAr: 'خوخ ودراق', folder: 'Peach', fileBase: 'peach', emoji: '🍑', category: 'fruits_veggies' },
  { id: 'pear', name: 'Pear', nameAr: 'كمثرى', folder: 'Pear', fileBase: 'pear', emoji: '🍐', category: 'fruits_veggies' },
  { id: 'kiwi_fruit', name: 'Kiwi', nameAr: 'كيوي منعش', folder: 'Kiwi fruit', fileBase: 'kiwi_fruit', emoji: '🥝', category: 'fruits_veggies' },
  { id: 'melon', name: 'Melon', nameAr: 'شمام وميلون', folder: 'Melon', fileBase: 'melon', emoji: '🍈', category: 'fruits_veggies' },
  { id: 'coconut', name: 'Coconut', nameAr: 'جوز هند استوائي', folder: 'Coconut', fileBase: 'coconut', emoji: '🥥', category: 'fruits_veggies' },
  { id: 'hot_pepper', name: 'Spicy Chili', nameAr: 'فلفل حار وسبايسي', folder: 'Hot pepper', fileBase: 'hot_pepper', emoji: '🌶️', category: 'fruits_veggies' },
];

const FOOD_KEYWORD_RULES: Array<{ keys: string[]; id: string }> = [
  { keys: ['burger', 'برجر', 'سمادش', 'smash', '🍔'], id: 'hamburger' },
  { keys: ['pizza', 'بيتزا', '🍕'], id: 'pizza' },
  { keys: ['boba', 'bubble tea', 'bubble_tea', 'ماتشا', '🧋'], id: 'bubble_tea' },
  { keys: ['drink', 'beverage', 'soda', 'مشروب', 'مشروبات', 'عصير', 'jus', 'boisson', '🥤'], id: 'cup_with_straw' },
  { keys: ['coffee', 'cafe', 'café', 'espresso', 'latte', 'قهوة', 'كافيه', 'إسبريسو', 'لاتيه', '☕'], id: 'hot_beverage' },
  { keys: ['soft_ice_cream', 'soft ice cream', 'ايس كريم مخروط', 'مخروط', '🍦'], id: 'soft_ice_cream' },
  { keys: ['ice cream', 'ice', 'crime', 'gelato', 'مثلجات', 'ايس', 'آيس', 'جيلاتو', 'glace', '🍨'], id: 'soft_ice_cream' },
  { keys: ['dessert', 'sweet', 'sweets', 'cake', 'tart', 'حلو', 'حلوى', 'حلويات', 'كيك', 'تارت', 'gâteau', '🍰', '🎂'], id: 'shortcake' },
  { keys: ['doughnut', 'donut', 'دونات', '🍩'], id: 'doughnut' },
  { keys: ['cookie', 'كوكيز', 'بسكويت', '🍪'], id: 'cookie' },
  { keys: ['waffle', 'وافل', '🧇'], id: 'waffle' },
  { keys: ['pancake', 'بان كيك', '🥞'], id: 'pancakes' },
  { keys: ['taco', 'tacos', 'طاكوس', 'تاكو', '🌮'], id: 'taco' },
  { keys: ['chicken', 'poulet', 'wings', 'nuggets', 'دجاج', 'فراخ', 'أجنحة', '🍗'], id: 'poultry_leg' },
  { keys: ['grill', 'grills', 'meat', 'steak', 'bbq', 'مشاوي', 'مشويات', 'لحم', 'لحوم', 'ستيك', 'viande', '🥩', '🍖'], id: 'cut_of_meat' },
  { keys: ['sandwich', 'sandwiches', 'panini', 'shawarma', 'chawarma', 'ساندويتش', 'سندويتش', 'شاورما', 'بانيني', '🥪', '🥙'], id: 'sandwich' },
  { keys: ['salad', 'salads', 'سلطة', 'سلطات', 'salade', '🥗'], id: 'green_salad' },
  { keys: ['fries', 'frite', 'frites', 'side', 'sides', 'بطاطس', 'مقبلات', 'بطاطا', '🍟'], id: 'french_fries' },
  { keys: ['pasta', 'spaghetti', 'باستا', 'معكرونة', 'مكرونة', 'سباغيتي', '🍝'], id: 'spaghetti' },
  { keys: ['seafood', 'fish', 'shrimp', 'سمك', 'أسماك', 'جمبري', 'روبيان', 'بحريات', 'poisson', 'crevette', '🦐', '🐟'], id: 'shrimp' },
  { keys: ['soup', 'soups', 'شوربة', 'حساء', 'soupe', '🥣', '🍲'], id: 'bowl_with_spoon' },
  { keys: ['breakfast', 'egg', 'eggs', 'فطور', 'صباحي', 'بيض', 'oeuf', '🍳', '🥚'], id: 'cooking' },
  { keys: ['juice', 'juices', 'fresh', 'طازج', 'jus de fruits', '🧃', '🍹'], id: 'tropical_drink' },
  { keys: ['appetizer', 'appetizers', 'dumpling', 'dumplings', 'مقبلات', 'خفايف', '🥟'], id: 'dumpling' },
  { keys: ['croissant', 'كرواسون', '🥐'], id: 'croissant' },
  { keys: ['hot dog', 'hot_dog', 'هوت دوج', '🌭'], id: 'hot_dog' },
];

/**
 * Resolves any category name or explicit icon string to a guaranteed high-res 3D Fluent Food Emoji PNG URL.
 */
export function resolveCategoryFluentEmojiUrl(name: string, explicitIcon?: string | null): string {
  const iconStr = (explicitIcon || '').trim();

  // 1. If explicitly a valid image URL, return it directly
  if (
    iconStr.startsWith('http://') ||
    iconStr.startsWith('https://') ||
    iconStr.startsWith('/') ||
    iconStr.startsWith('blob:') ||
    iconStr.startsWith('data:')
  ) {
    return iconStr;
  }

  const cleanName = (name || '').toLowerCase().trim();
  const searchSources = [iconStr.toLowerCase(), cleanName];

  // 2. Keyword rules lookup
  for (const rule of FOOD_KEYWORD_RULES) {
    if (rule.keys.some((k) => searchSources.some((src) => src.includes(k)))) {
      const match = FLUENT_FOOD_EMOJIS.find((e) => e.id === rule.id);
      if (match) return getFluentEmojiUrl(match, '3d');
    }
  }

  // 3. Direct unicode emoji character match
  if (iconStr) {
    const directEmoji = FLUENT_FOOD_EMOJIS.find((e) => e.emoji === iconStr);
    if (directEmoji) return getFluentEmojiUrl(directEmoji, '3d');
  }

  // 4. Fallback by category ID or name in full emoji dictionary
  const dictionaryMatch = FLUENT_FOOD_EMOJIS.find(
    (e) =>
      cleanName.includes(e.name.toLowerCase()) ||
      cleanName.includes(e.nameAr.toLowerCase()) ||
      cleanName.includes(e.fileBase.toLowerCase())
  );
  if (dictionaryMatch) return getFluentEmojiUrl(dictionaryMatch, '3d');

  // 5. Default tasty burger
  const fallback = FLUENT_FOOD_EMOJIS.find((e) => e.id === 'hamburger');
  return fallback
    ? getFluentEmojiUrl(fallback, '3d')
    : `${CDN_BASE}/Hamburger/3D/hamburger_3d.png`;
}
