export interface WordCategory {
  name: string;
  emoji: string;
  words: string[];
}

export const categories: WordCategory[] = [
  {
    name: "Food & Drinks",
    emoji: "🍕",
    words: [
      "Pizza", "Sushi", "Tacos", "Burger", "Pasta", "Ice Cream", "Chocolate",
      "Pancakes", "Steak", "Salad", "Soup", "Sandwich", "Popcorn", "Waffles",
      "Nachos", "Ramen", "Curry", "Burrito", "Donut", "Croissant", "Bagel",
      "Pretzel", "Smoothie", "Coffee", "Milkshake", "Lemonade", "Hot Dog",
      "French Fries", "Fried Chicken", "Mac and Cheese"
    ],
  },
  {
    name: "Animals",
    emoji: "🐾",
    words: [
      "Dog", "Cat", "Elephant", "Penguin", "Dolphin", "Tiger", "Giraffe",
      "Monkey", "Shark", "Eagle", "Rabbit", "Horse", "Panda", "Koala",
      "Octopus", "Flamingo", "Chameleon", "Whale", "Parrot", "Turtle",
      "Jellyfish", "Kangaroo", "Peacock", "Hamster", "Sloth", "Crocodile",
      "Butterfly", "Hedgehog", "Owl", "Fox"
    ],
  },
  {
    name: "Places",
    emoji: "🌍",
    words: [
      "Beach", "Mountain", "Library", "Hospital", "Airport", "Museum",
      "Restaurant", "School", "Cinema", "Park", "Mall", "Stadium",
      "Church", "Zoo", "Gym", "Hotel", "Casino", "Farm", "Castle",
      "Lighthouse", "Volcano", "Waterfall", "Desert", "Forest", "Cave",
      "Island", "Subway", "Aquarium", "Carnival", "Skyscraper"
    ],
  },
  {
    name: "Movies & TV",
    emoji: "🎬",
    words: [
      "Titanic", "Batman", "Star Wars", "Harry Potter", "Frozen",
      "The Lion King", "Avengers", "Jurassic Park", "Finding Nemo",
      "Shrek", "Spider-Man", "Toy Story", "The Matrix", "Jaws",
      "Forrest Gump", "Ghostbusters", "Indiana Jones", "Rocky",
      "The Godfather", "Back to the Future", "Stranger Things",
      "Game of Thrones", "Friends", "The Office", "Breaking Bad",
      "Squid Game", "Wednesday", "Barbie", "Top Gun", "Minecraft Movie"
    ],
  },
  {
    name: "Sports & Hobbies",
    emoji: "⚽",
    words: [
      "Soccer", "Basketball", "Swimming", "Tennis", "Golf", "Boxing",
      "Surfing", "Skiing", "Yoga", "Chess", "Painting", "Fishing",
      "Gardening", "Dancing", "Bowling", "Karate", "Volleyball",
      "Skateboarding", "Rock Climbing", "Photography", "Cooking",
      "Hiking", "Cycling", "Baseball", "Wrestling", "Archery",
      "Snowboarding", "Gymnastics", "Fencing", "Table Tennis"
    ],
  },
  {
    name: "Everyday Objects",
    emoji: "🔧",
    words: [
      "Umbrella", "Toothbrush", "Mirror", "Pillow", "Lamp", "Clock",
      "Scissors", "Key", "Wallet", "Backpack", "Sunglasses", "Headphones",
      "Candle", "Blanket", "Remote Control", "Towel", "Doorbell",
      "Calendar", "Notebook", "Stapler", "Microwave", "Refrigerator",
      "Vacuum Cleaner", "Hair Dryer", "Alarm Clock", "Trash Can",
      "Light Switch", "Pencil Sharpener", "Rubber Duck", "Tape"
    ],
  },
  {
    name: "Jobs & Professions",
    emoji: "👔",
    words: [
      "Doctor", "Teacher", "Firefighter", "Astronaut", "Chef", "Pilot",
      "Detective", "Dentist", "Lawyer", "Plumber", "Electrician",
      "Lifeguard", "Mechanic", "Farmer", "Librarian", "Mailman",
      "Barber", "Architect", "Photographer", "Musician", "Veterinarian",
      "Scientist", "Cashier", "Waiter", "Bus Driver", "Janitor",
      "Magician", "Clown", "Surgeon", "Florist"
    ],
  },
  {
    name: "Celebrations",
    emoji: "🎉",
    words: [
      "Birthday", "Wedding", "Christmas", "Halloween", "Thanksgiving",
      "New Year", "Valentine's Day", "Easter", "Graduation", "Baby Shower",
      "Anniversary", "Prom", "Carnival", "Super Bowl", "Concert",
      "Parade", "Fireworks", "Sleepover", "Pool Party", "Barbecue",
      "Camping Trip", "Road Trip", "Karaoke Night", "Game Night",
      "Movie Night", "Costume Party", "Dance Party", "Talent Show",
      "Scavenger Hunt", "Surprise Party"
    ],
  },
];

export function getRandomWord(categoryIndex?: number): { word: string; category: string } {
  const catIdx = categoryIndex !== undefined ? categoryIndex : Math.floor(Math.random() * categories.length);
  const category = categories[catIdx];
  const word = category.words[Math.floor(Math.random() * category.words.length)];
  return { word, category: category.name };
}
