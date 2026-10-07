
const API_URL = "https://jsonplaceholder.typicode.com/users";

const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusText = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let allUsers = [];

function renderUsers(usersToDisplay) {
    usersList.innerHTML = ""; 
  
  if (usersToDisplay.length === 0 && allUsers.length > 0) {
    statusText.textContent = "No users match your filter.";
    return;
  }

    usersToDisplay.forEach(user => {
    const li = document.createElement("li");
    li.textContent = `${user.name} | ${user.email} | ${user.address.city} | ${user.company.name}`;
    usersList.appendChild(li);
  });
}

async function loadUsers() {
  statusText.textContent = "Loading users...";
  loadBtn.disabled = true; 
  usersList.innerHTML = "";
  filterInput.value = ""; 

  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    
    allUsers = await response.json();
    
    renderUsers(allUsers);
    
    statusText.textContent = `Loaded ${allUsers.length} users successfully.`;
    
    filterInput.focus(); 
    
  } catch (error) {
    statusText.textContent = "Could not load users. Please try again.";
    console.error("Error loading users:", error.message);
  } finally {
    loadBtn.disabled = false; 
  }
}

filterInput.addEventListener("input", () => {
  const filterText = filterInput.value.trim().toLowerCase();

  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(filterText)
  );
  
  renderUsers(filteredUsers);

  if (filterText === "" && allUsers.length > 0) {
    statusText.textContent = `Loaded ${allUsers.length} users successfully.`;
  }
});

filterInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    filterInput.value = "";    

    renderUsers(allUsers);
    if (allUsers.length > 0) {
      statusText.textContent = `Loaded ${allUsers.length} users successfully.`;
    }
  }
});

loadBtn.addEventListener("click", loadUsers);