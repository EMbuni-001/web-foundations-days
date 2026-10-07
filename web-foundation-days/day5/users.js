const API_URL = "https://jsonplaceholder.typicode.com/users";

const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusText = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let allUsers = [];
function renderUsers(list) {
  usersList.innerHTML = ""; 
  
  if (list.length === 0 && allUsers.length > 0) {
    statusText.textContent = "No users match your filter.";
    return;
  }
  
  list.forEach(user => {
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
    
  } catch (error) {
    statusText.textContent = "Could not load users. Please try again.";
    console.error("Error loading users:", error.message);
  } finally {
    loadBtn.disabled = false; 
  }
}

filterInput.addEventListener("input", () => {
  const filterText = filterInput.value.toLowerCase();
  
  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(filterText)
  );
  
  renderUsers(filteredUsers);
});

loadBtn.addEventListener("click", loadUsers);
