
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

//1. searchNotes
// Returns an array of notes whose text contains the word, ignoring upper and lower case.
function searchNotes(word) {
  const searchTerm = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(searchTerm));
}

//2. longestNote
//Returns the note object with the most characters, or null if there are no notes.
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }

  return longest;
}

//3. countByCategory
//Returns an object counting notes per category.
function countByCategory() {
  const counts = {};

  for (const note of notes) {
    const category = note.category;
    counts[category] = (counts[category] || 0) + 1;
  }

  return counts;
}

// 4. getSummary()
// Returns a sentence such as "5 notes: 2 personal, 1 work, 2 study."
function getSummary() {
  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";
  const counts = countByCategory();
  const categoryParts = [];

  for (const category in counts) {
    categoryParts.push(`${counts[category]} ${category}`);
  }

  return `${total} ${noteWord}: ${categoryParts.join(", ")}.`;
}

// 5. isDuplicate(text)
// Returns true if a note with the same text already exists (ignoring case and extra spaces).
function isDuplicate(text) {
  const cleanedText = text.trim().toLowerCase();
  return notes.some((note) => note.text.trim().toLowerCase() === cleanedText);
}

// 6. addNote(text, category)
// Adds a note only if it is 1–200 characters, is not a duplicate, and category is personal, work, or study.
function addNote(text, category) {
  const cleanedText = text.trim();
  const validCategories = ["personal", "work", "study"];

  if (cleanedText.length < 1 || cleanedText.length > 200) {
    console.log("Note rejected: length must be between 1 and 200 characters.");
    return false;
  }

  if (isDuplicate(text)) {
    console.log("Note rejected: duplicate text found.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Note rejected: invalid category. Must be personal, work, or study.");
    return false;
  }

  const newNote = {
    id: Date.now(),
    text: cleanedText,
    category: category,
  };

  notes.push(newNote);
  console.log(`Note added: "${cleanedText}"`);
  return true;
}
