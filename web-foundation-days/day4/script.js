
const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");


function loadDraft() {
    const savedDraft = localStorage.getItem("draft");
    if (savedDraft) {
        noteText.value = savedDraft;
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "Light mode";
    }
}

function updateCounts() {
    const text = noteText.value;
    const charLength = text.length;
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

    charCount.textContent = `${charLength} / 200 characters`;
    wordCount.textContent = `${words} words`;

    charCount.classList.remove("warning", "over");

    if (charLength > 200) {
        charCount.classList.add("over");
    } else if (charLength > 180) {
        charCount.classList.add("warning");
    }
}

function saveDraft() {
    localStorage.setItem("draft", noteText.value);
}

noteText.addEventListener("input", () => {
    updateCounts();
    saveDraft();
});

clearBtn.addEventListener("click", () => {
    noteText.value = "";
    updateCounts();
    localStorage.removeItem("draft");
});

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    if (document.body.classList.contains("dark")) {
        themeToggle.textContent = "Light mode";
        localStorage.setItem("theme", "dark");
    } else {
        themeToggle.textContent = "Dark mode";
        localStorage.setItem("theme", "light");
    }
});

noteText.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        noteText.value = "";
        updateCounts();
        localStorage.removeItem("draft");
    }
});

loadDraft();
loadTheme();
updateCounts();