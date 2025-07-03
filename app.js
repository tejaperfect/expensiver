// Expensiver - Group Expense Tracker
// Main app.js file

// ===============================
// GLOBAL STATE
// ===============================
let currentUser = {
  id: generateId(),
  name: 'Your Name',
  email: '',
  phone: '',
  avatar: 'default',
  preferences: {
    currency: '₹',
    theme: 'light',
    notifications: true
  },
  wallet: {
    balance: 0,
    totalPaid: 0,
    totalReceived: 0,
    pendingSettlements: 0,
    transactions: []
  }
};

let groups = [];
let currentGroupId = null;

// ===============================
// INITIALIZATION
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  // Load data from localStorage
  loadUserData();
  loadGroups();
  
  // Initialize date inputs with current date
  const dateInputs = document.querySelectorAll('input[type="date"]');
  const today = new Date().toISOString().split('T')[0];
  dateInputs.forEach(input => {
    input.value = today;
  });
  
  // Setup event listeners
  setupEventListeners();
  
  // Update UI
  updateDashboard();
  updateProfile();
  
  // Show notification on first load
  if (!localStorage.getItem('welcomed')) {
    showNotification('Welcome to Expensiver! Create or join a group to get started.', 'info');
    localStorage.setItem('welcomed', 'true');
  }
});

// ===============================
// EVENT LISTENERS
// ===============================
function setupEventListeners() {
  // Form submissions
  document.getElementById('create-group-form').addEventListener('submit', handleCreateGroup);
  document.getElementById('join-group-form').addEventListener('submit', handleJoinGroup);
  document.getElementById('add-expense-form').addEventListener('submit', handleAddExpense);
  document.getElementById('add-member-form').addEventListener('submit', handleAddMember);
  document.getElementById('settle-up-form').addEventListener('submit', handleSettleUp);
  
  // For dark mode toggle in profile
  const themeSelector = document.getElementById('theme-preference');
  if (themeSelector) {
    themeSelector.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  }
  
  // Initialize theme from local storage or system preference
  initializeTheme();
}

// ===============================
// UTILITY FUNCTIONS
// ===============================
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function formatCurrency(amount, currency = currentUser.preferences.currency) {
  return `${currency}${parseFloat(amount).toFixed(2)}`;
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function getRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

// ===============================
// LOCAL STORAGE
// ===============================
function saveUserData() {
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function loadUserData() {
  const userData = localStorage.getItem('currentUser');
  if (userData) {
    currentUser = JSON.parse(userData);
  }
}

function saveGroups() {
  localStorage.setItem('groups', JSON.stringify(groups));
}

function loadGroups() {
  const groupsData = localStorage.getItem('groups');
  if (groupsData) {
    groups = JSON.parse(groupsData);
  }
}

// ===============================
// UI MANAGEMENT
// ===============================
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show the selected section
  document.getElementById(sectionId).classList.add('active');
  
  // For group details page, we need special handling
  if (sectionId === 'group-details' && currentGroupId) {
    loadGroupDetails(currentGroupId);
    showExpensesEnhanced(); // Default to showing expenses tab
  }
  
  // If showing dashboard, update it
  if (sectionId === 'dashboard') {
    updateDashboard();
  }

  // If showing profile, update it
  if (sectionId === 'profile') {
    updateProfile();
  }
  
  // If showing wallet, initialize wallet dashboard
  if (sectionId === 'wallet') {
    updateWalletDashboard();
  }
}

// Function to initialize and update the wallet dashboard
function updateWalletDashboard() {
  // Update wallet balance and stats
  document.getElementById('wallet-balance').textContent = formatCurrency(currentUser.wallet.balance);
  document.getElementById('total-paid').textContent = formatCurrency(currentUser.wallet.totalPaid);
  document.getElementById('total-received').textContent = formatCurrency(currentUser.wallet.totalReceived);
  document.getElementById('pending-settlements').textContent = formatCurrency(currentUser.wallet.pendingSettlements);
  
  // Update recent transactions
  const transactions = currentUser.wallet.transactions || [];
  const recentTransactions = transactions.sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  }).slice(0, 3);
  
  updateRecentTransactions(recentTransactions);
  
  // Initialize wallet spending chart
  initializeWalletSpendingChart();
}

function showModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
  
  // Special handling for certain modals
  if (modalId === 'add-expense-modal') {
    populateExpenseModal();
  } else if (modalId === 'settle-up-modal') {
    populateSettleUpModal();
  } else if (modalId === 'edit-profile-modal') {
    // Populate profile data
    document.getElementById('edit-name').value = currentUser.name;
    document.getElementById('edit-email').value = currentUser.email || '';
    document.getElementById('edit-phone').value = currentUser.phone || '';
    document.getElementById('selected-avatar').value = currentUser.avatar || 'default';
    
    // Select the correct avatar
    document.querySelectorAll('.avatar-option').forEach(option => {
      option.classList.remove('selected');
    });
    document.querySelector(`.avatar-option[data-avatar="${currentUser.avatar || 'default'}"]`).classList.add('selected');
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  
  // Reset forms when closing modals
  if (modalId === 'add-expense-modal') {
    document.getElementById('add-expense-form').reset();
  } else if (modalId === 'add-member-modal') {
    document.getElementById('add-member-form').reset();
  } else if (modalId === 'settle-up-modal') {
    document.getElementById('settle-up-form').reset();
  } else if (modalId === 'add-budget-modal') {
    document.getElementById('add-budget-form').reset();
  } else if (modalId === 'add-funds-modal') {
    document.getElementById('add-funds-form').reset();
  }
}

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = 'block';
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// Apply theme (light/dark) to the app
function applyTheme(theme) {
  if (theme === 'system') {
    // Use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-theme', prefersDark);
  } else {
    // Use selected preference
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }
  
  // Save preference
  if (currentUser && currentUser.preferences) {
    currentUser.preferences.theme = theme;
    saveUserData();
  }
}

// Initialize theme based on user preference or system default
function initializeTheme() {
  const themePreference = currentUser?.preferences?.theme || 'light';
  
  // Set the select value
  const themeSelector = document.getElementById('theme-preference');
  if (themeSelector) {
    themeSelector.value = themePreference;
  }
  
  // Apply the theme
  applyTheme(themePreference);
}

// ===============================
// DASHBOARD FUNCTIONS
// ===============================
function updateDashboard() {
  // Update wallet details
  document.getElementById('wallet-balance').textContent = formatCurrency(currentUser.wallet.balance);
  document.getElementById('wallet-balance-mini').textContent = formatCurrency(currentUser.wallet.balance);
  document.getElementById('total-paid').textContent = formatCurrency(currentUser.wallet.totalPaid);
  document.getElementById('total-paid-mini').textContent = formatCurrency(currentUser.wallet.totalPaid);
  document.getElementById('total-received').textContent = formatCurrency(currentUser.wallet.totalReceived);
  document.getElementById('total-received-mini').textContent = formatCurrency(currentUser.wallet.totalReceived);
  document.getElementById('pending-settlements').textContent = formatCurrency(currentUser.wallet.pendingSettlements);
  
  // Render groups
  renderGroups();
}

function renderGroups() {
  const groupsContainer = document.getElementById('groups-container');
  
  // Clear previous content
  groupsContainer.innerHTML = '';
  
  if (groups.length === 0) {
    // Show empty state message
    groupsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <h3>No Groups Found</h3>
        <p>Create a new group or join an existing one to get started.</p>
        <div style="margin-top: 1rem;">
          <button class="primary-button" onclick="showSection('create-group')">
            <i class="fas fa-plus-circle"></i> Create Group
          </button>
          <button class="secondary-button" onclick="showSection('join-group')">
            <i class="fas fa-sign-in-alt"></i> Join Group
          </button>
        </div>
      </div>
    `;
    return;
  }
  
  // Sort groups by recent activity
  const sortedGroups = [...groups].sort((a, b) => {
    const aDate = a.lastActivity ? new Date(a.lastActivity) : new Date(0);
    const bDate = b.lastActivity ? new Date(b.lastActivity) : new Date(0);
    return bDate - aDate;
  });
  
  // Render each group
  sortedGroups.forEach(group => {
    const totalExpenses = group.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const lastActivity = group.lastActivity ? getRelativeTime(group.lastActivity) : 'No activity';
    
    // Get user's balance in this group
    const userBalance = calculateUserBalance(group.id, currentUser.id);
    const balanceClass = userBalance > 0 ? 'balance-positive' : (userBalance < 0 ? 'balance-negative' : '');
    
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card';
    groupCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3>
          <i class="fas fa-${getCategoryIcon(group.category)}"></i> ${group.name}
        </h3>
        <span class="data-badge data-badge-primary">
          <i class="fas fa-users"></i> ${group.members.length}
        </span>
      </div>
      
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
        <div>
          <div style="font-weight: 600; color: var(--text-dark);">Total Expenses:</div>
          <div style="font-size: 1.2rem; font-weight: 700;">${group.currency}${totalExpenses.toFixed(2)}</div>
        </div>
        <div>
          <div style="font-weight: 600; color: var(--text-dark);">Your Balance:</div>
          <div class="${balanceClass}" style="font-size: 1.2rem; font-weight: 700;">${formatCurrency(Math.abs(userBalance), group.currency)}</div>
          <div style="font-size: 0.9rem; color: var(--text-light);">${userBalance > 0 ? 'you are owed' : (userBalance < 0 ? 'you owe' : 'settled up')}</div>
        </div>
      </div>
      
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
        ${group.members.slice(0, 5).map(member => `
          <div class="member-tag">
            <i class="fas fa-user"></i> ${member.name}
          </div>
        `).join('')}
        ${group.members.length > 5 ? `<div class="member-tag">+${group.members.length - 5} more</div>` : ''}
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="color: var(--text-light); font-size: 0.9rem;">
          <i class="fas fa-clock"></i> ${lastActivity}
        </div>
        <div>
          <button class="primary-button" onclick="viewGroup('${group.id}')">
            View Details
          </button>
        </div>
      </div>
    `;
    
    groupsContainer.appendChild(groupCard);
  });
}

function getCategoryIcon(category) {
  switch (category) {
    case 'trip': return 'plane';
    case 'home': return 'home';
    case 'event': return 'calendar-alt';
    case 'project': return 'briefcase';
    default: return 'users';
  }
}

// ===============================
// PROFILE MANAGEMENT
// ===============================
function updateProfile() {
  // Update profile information
  document.getElementById('profile-name').textContent = currentUser.name;
  document.getElementById('profile-user-id').textContent = currentUser.id;
  
  // Update profile stats
  document.getElementById('profile-groups-count').textContent = groups.length;
  
  let totalExpensesCount = 0;
  groups.forEach(group => {
    totalExpensesCount += group.expenses.length;
  });
  document.getElementById('profile-expenses-count').textContent = totalExpensesCount;
  
  document.getElementById('profile-wallet-balance').textContent = formatCurrency(currentUser.wallet.balance);
  
  let settlementsCount = 0;
  groups.forEach(group => {
    settlementsCount += group.settlements.length;
  });
  document.getElementById('profile-settlements-count').textContent = settlementsCount;
  
  // Set default preferences
  document.getElementById('default-currency').value = currentUser.preferences.currency;
  document.getElementById('theme-preference').value = currentUser.preferences.theme;
  document.getElementById('notifications-preference').checked = currentUser.preferences.notifications;
  
  // Render user groups in profile
  renderUserGroups();
  
  // Generate profile QR code
  generateProfileQR();
}

function renderUserGroups() {
  const userGroupsContainer = document.getElementById('user-groups-container');
  
  // Clear previous content
  userGroupsContainer.innerHTML = '';
  
  if (groups.length === 0) {
    userGroupsContainer.innerHTML = `
      <div class="empty-state" style="padding: 1rem;">
        <p>You haven't joined any groups yet.</p>
        <button class="secondary-button" onclick="showSection('create-group')" style="margin-top: 0.5rem;">
          <i class="fas fa-plus-circle"></i> Create Group
        </button>
      </div>
    `;
    return;
  }
  
  // Sort groups by recent activity
  const sortedGroups = [...groups].sort((a, b) => {
    const aDate = a.lastActivity ? new Date(a.lastActivity) : new Date(0);
    const bDate = b.lastActivity ? new Date(b.lastActivity) : new Date(0);
    return bDate - aDate;
  });
  
  sortedGroups.forEach(group => {
    const userBalance = calculateUserBalance(group.id, currentUser.id);
    const balanceClass = userBalance > 0 ? 'balance-positive' : (userBalance < 0 ? 'balance-negative' : '');
    
    const groupCard = document.createElement('div');
    groupCard.className = 'user-group-card';
    groupCard.innerHTML = `
      <div class="user-group-name" onclick="viewGroup('${group.id}')">
        <i class="fas fa-${getCategoryIcon(group.category)}"></i> ${group.name}
      </div>
      <div class="user-group-meta">
        <span class="user-group-id">${group.inviteCode}</span>
        <span class="${balanceClass}">${formatCurrency(Math.abs(userBalance), group.currency)}</span>
      </div>
    `;
    
    userGroupsContainer.appendChild(groupCard);
  });
}

function generateProfileQR() {
  // Placeholder for actual QR code generation
  // In a real app, you'd use a library like qrcode.js
  const qrContainer = document.getElementById('profile-qr-code');
  qrContainer.innerHTML = `
    <div style="width:150px; height:150px; background-color:#f3f4f6; display:flex; align-items:center; justify-content:center; color:#1f2937;">
      <div style="text-align:center;">
        <i class="fas fa-qrcode" style="font-size:50px; margin-bottom:10px;"></i>
        <div style="font-size:12px;">QR Placeholder</div>
        <div style="font-size:10px; margin-top:5px;">${currentUser.id}</div>
      </div>
    </div>
  `;
}

function saveProfile() {
  // Get values from form
  const newName = document.getElementById('edit-name').value;
  const oldName = currentUser.name;
  currentUser.name = newName;
  currentUser.email = document.getElementById('edit-email').value;
  currentUser.phone = document.getElementById('edit-phone').value;
  currentUser.avatar = document.getElementById('selected-avatar').value;
  
  // Update user name in all groups they're a member of
  if (newName !== oldName) {
    groups.forEach(group => {
      const memberIndex = group.members.findIndex(member => member.id === currentUser.id);
      if (memberIndex !== -1) {
        group.members[memberIndex].name = newName;
      }
    });
    // Save groups data with updated names
    saveGroups();
  }
  
  // Save to local storage
  saveUserData();
  
  // Update profile view
  updateProfile();
  
  // Close modal
  closeModal('edit-profile-modal');
  
  // Show notification
  showNotification('Profile updated successfully');
}

function updateUserPreference(key, value) {
  if (!currentUser.preferences) {
    currentUser.preferences = {};
  }
  
  currentUser.preferences[key] = value;
  saveUserData();
  
  if (key === 'theme') {
    applyTheme(value);
  }
  
  showNotification('Preference updated');
}

// ===============================
// GROUP MANAGEMENT
// ===============================
function handleCreateGroup(e) {
  e.preventDefault();
  
  // Get form data
  const name = document.getElementById('group-name').value;
  const description = document.getElementById('group-description').value;
  const currency = document.getElementById('group-currency').value;
  const category = document.getElementById('group-category').value;
  const memberNames = document.getElementById('member-names').value;
  
  // Split member names and trim whitespace
  let members = [];
  if (memberNames) {
    members = memberNames.split(',').map(name => ({
      id: generateId(),
      name: name.trim()
    }));
  }
  
  // Add current user as a member (if not already in the list)
  if (!members.some(member => member.name === currentUser.name)) {
    members.unshift({
      id: currentUser.id,
      name: currentUser.name
    });
  }
  
  // Create new group
  const newGroup = {
    id: generateId(),
    inviteCode: generateCode(),
    name,
    description,
    currency,
    category,
    members,
    expenses: [],
    settlements: [],
    budgets: [],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
  
  // Add to groups array
  groups.push(newGroup);
  
  // Save to local storage
  saveGroups();
  
  // Reset form
  document.getElementById('create-group-form').reset();
  
  // Show notification
  showNotification(`Group "${name}" created successfully!`);
  
  // Go to dashboard
  showSection('dashboard');
}

function handleJoinGroup(e) {
  e.preventDefault();
  
  const codeOrId = document.getElementById('group-code').value;
  const yourName = document.getElementById('your-name').value;
  
  // Find group by code or id
  const group = groups.find(g => g.inviteCode === codeOrId || g.id === codeOrId);
  
  if (!group) {
    showNotification('Group not found. Please check the code and try again.', 'error');
    return;
  }
  
  // Check if user is already a member
  if (group.members.some(member => member.name === yourName)) {
    showNotification('You are already a member of this group.', 'error');
    return;
  }
  
  // Add user to group members
  group.members.push({
    id: currentUser.id,
    name: yourName
  });
  
  // Update last activity
  group.lastActivity = new Date().toISOString();
  
  // Save changes
  saveGroups();
  
  // Update currentUser name if different
  if (currentUser.name !== yourName) {
    currentUser.name = yourName;
    saveUserData();
  }
  
  // Reset form
  document.getElementById('join-group-form').reset();
  
  // Show notification
  showNotification(`You have joined "${group.name}" successfully!`);
  
  // Go to dashboard
  showSection('dashboard');
}

function viewGroup(groupId) {
  currentGroupId = groupId;
  showSection('group-details');
}

function loadGroupDetails(groupId) {
  const group = groups.find(g => g.id === groupId);
  
  if (!group) {
    showNotification('Group not found.', 'error');
    showSection('dashboard');
    return;
  }
  
  // Set group title
  document.getElementById('group-title').innerHTML = `
    <i class="fas fa-${getCategoryIcon(group.category)}"></i> ${group.name}
  `;
  
  // Set group ID and invite code
  document.getElementById('group-unique-id').textContent = group.id;
  document.getElementById('group-invite-code').textContent = group.inviteCode;
  
  // Update stats
  const totalExpenses = group.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  document.getElementById('total-expenses').textContent = `${group.currency}${totalExpenses.toFixed(2)}`;
  document.getElementById('total-members').textContent = group.members.length;
  document.getElementById('expense-count').textContent = group.expenses.length;
  
  const avgExpense = group.expenses.length > 0 ? totalExpenses / group.expenses.length : 0;
  document.getElementById('avg-expense').textContent = `${group.currency}${avgExpense.toFixed(2)}`;
}

// ===============================
// EXPENSE MANAGEMENT
// ===============================
function populateExpenseModal() {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Set default date to today
  document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
  
  // Populate payer dropdown
  const payerSelect = document.getElementById('expense-payer');
  payerSelect.innerHTML = '';
  
  group.members.forEach(member => {
    const option = document.createElement('option');
    option.value = member.id;
    option.textContent = member.name;
    
    // Default to current user
    if (member.id === currentUser.id) {
      option.selected = true;
    }
    
    payerSelect.appendChild(option);
  });
  
  // Populate split members checkboxes
  const splitMembersContainer = document.getElementById('expense-split-members');
  splitMembersContainer.innerHTML = '';
  
  group.members.forEach(member => {
    const div = document.createElement('div');
    div.className = 'checkbox-item';
    div.innerHTML = `
      <input type="checkbox" id="split-member-${member.id}" value="${member.id}" checked>
      <label for="split-member-${member.id}">${member.name}</label>
    `;
    splitMembersContainer.appendChild(div);
  });
  
  // Clear custom split container
  document.getElementById('custom-split-container').innerHTML = '';
  document.getElementById('custom-split-container').style.display = 'none';
  
  // Reset multiple payers
  document.getElementById('multiple-payers-toggle').checked = false;
  document.getElementById('multiple-payers-container').style.display = 'none';
  document.getElementById('payers-list').innerHTML = '';
}

function toggleSplitOptions() {
  const splitType = document.getElementById('split-type').value;
  const customSplitContainer = document.getElementById('custom-split-container');
  const excludedMembersContainer = document.getElementById('excluded-members-container');
  
  customSplitContainer.style.display = 'none';
  excludedMembersContainer.style.display = 'none';
  
  if (splitType === 'equal') {
    return;
  }
  
  if (splitType === 'exclude') {
    excludedMembersContainer.style.display = 'block';
    return;
  }
  
  // For other split types, generate custom inputs
  customSplitContainer.style.display = 'block';
  customSplitContainer.innerHTML = '';
  
  // Get all checked members
  const checkedMembers = Array.from(document.querySelectorAll('#expense-split-members input:checked'))
    .map(input => {
      const member = groups.find(g => g.id === currentGroupId)?.members.find(m => m.id === input.value);
      return member;
    })
    .filter(Boolean);
    
  if (checkedMembers.length === 0) {
    customSplitContainer.innerHTML = '<p>Please select at least one member to split with.</p>';
    return;
  }
  
  // Create appropriate inputs based on split type
  customSplitContainer.innerHTML = `<label>${getSplitTypeLabel(splitType)}</label>`;
  
  const inputContainer = document.createElement('div');
  inputContainer.className = 'split-input-group';
  
  checkedMembers.forEach(member => {
    const wrapper = document.createElement('div');
    wrapper.className = 'split-input-wrapper';
    
    let input = '';
    switch (splitType) {
      case 'unequal':
        input = `
          <span>${member.name}</span>
          <input type="number" id="split-${member.id}" class="custom-input" placeholder="0.00" step="0.01" min="0">
        `;
        break;
      case 'percentage':
        input = `
          <span>${member.name}</span>
          <input type="number" id="split-${member.id}" class="custom-input" placeholder="0" min="0" max="100">
          <span>%</span>
        `;
        break;
      case 'shares':
        input = `
          <span>${member.name}</span>
          <input type="number" id="split-${member.id}" class="custom-input shares-input" placeholder="1" min="1" value="1">
          <span>shares</span>
        `;
        break;
      case 'adjustment':
        input = `
          <span>${member.name}</span>
          <input type="number" id="split-${member.id}" class="custom-input" placeholder="0.00" step="0.01">
          <span>adjustment</span>
        `;
        break;
    }
    
    wrapper.innerHTML = input;
    inputContainer.appendChild(wrapper);
  });
  
  customSplitContainer.appendChild(inputContainer);
  
  // Add a total or message at the bottom if needed
  if (splitType === 'percentage') {
    const totalMessage = document.createElement('div');
    totalMessage.innerHTML = '<small>Total should add up to 100%</small>';
    customSplitContainer.appendChild(totalMessage);
  }
}

function getSplitTypeLabel(splitType) {
  switch (splitType) {
    case 'unequal': return 'Enter exact amounts for each person:';
    case 'percentage': return 'Enter percentage split for each person:';
    case 'shares': return 'Enter shares for each person:';
    case 'adjustment': return 'Enter adjustments (+ or -) for each person:';
    default: return 'Customize how to split this expense:';
  }
}

function toggleMultiplePayers() {
  const isMultiple = document.getElementById('multiple-payers-toggle').checked;
  document.getElementById('multiple-payers-container').style.display = isMultiple ? 'block' : 'none';
  document.querySelector('.toggle-label').textContent = isMultiple ? 'Yes' : 'No';
  
  if (isMultiple && document.getElementById('payers-list').children.length === 0) {
    addPayerField(); // Add first payer field automatically
  }
}

function addPayerField() {
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  const payersList = document.getElementById('payers-list');
  const payerItem = document.createElement('div');
  payerItem.className = 'payer-item';
  
  // Create a select dropdown with all members
  const selectHTML = `<select class="custom-input payer-select">
    ${group.members.map(member => `<option value="${member.id}">${member.name}</option>`).join('')}
  </select>`;
  
  payerItem.innerHTML = `
    ${selectHTML}
    <input type="number" class="custom-input payer-amount" placeholder="0.00" step="0.01" min="0">
    <button type="button" class="icon-button remove-payer" onclick="removePayerField(this)">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  payersList.appendChild(payerItem);
}

function removePayerField(button) {
  const payerItem = button.parentElement;
  payerItem.remove();
}

function handleAddExpense(e) {
  e.preventDefault();
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Get basic expense details
  const description = document.getElementById('expense-description').value;
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const date = document.getElementById('expense-date').value;
  const notes = document.getElementById('expense-notes').value;
  const splitType = document.getElementById('split-type').value;
  
  // Get selected members for splitting
  const selectedMemberIds = Array.from(document.querySelectorAll('#expense-split-members input:checked'))
    .map(input => input.value);
  
  if (selectedMemberIds.length === 0) {
    showNotification('Please select at least one member to split the expense with.', 'error');
    return;
  }
  
  // Handle payers (single or multiple)
  let payers = [];
  const isMultiplePayers = document.getElementById('multiple-payers-toggle').checked;
  
  if (isMultiplePayers) {
    // Get all payer fields
    const payerItems = document.querySelectorAll('.payer-item');
    let totalPaid = 0;
    
    payerItems.forEach(item => {
      const payerId = item.querySelector('.payer-select').value;
      const payerAmount = parseFloat(item.querySelector('.payer-amount').value);
      
      if (payerId && !isNaN(payerAmount) && payerAmount > 0) {
        payers.push({ id: payerId, amount: payerAmount });
        totalPaid += payerAmount;
      }
    });
    
    // Validate total paid matches expense amount
    if (Math.abs(totalPaid - amount) > 0.01) {
      showNotification('The sum of all payer amounts must equal the total expense amount.', 'error');
      return;
    }
  } else {
    // Single payer
    const payerId = document.getElementById('expense-payer').value;
    payers.push({ id: payerId, amount: amount });
  }
  
  // Handle split calculations based on split type
  let splits = [];
  
  switch (splitType) {
    case 'equal':
      // Equal split among selected members
      const equalShare = amount / selectedMemberIds.length;
      selectedMemberIds.forEach(memberId => {
        splits.push({ id: memberId, amount: equalShare });
      });
      break;
    
    case 'unequal':
    case 'percentage':
    case 'shares':
    case 'adjustment':
      // Get the custom split values
      if (splitType === 'unequal') {
        // Exact amounts
        let totalSplit = 0;
        selectedMemberIds.forEach(memberId => {
          const splitAmount = parseFloat(document.getElementById(`split-${memberId}`).value);
          if (!isNaN(splitAmount)) {
            splits.push({ id: memberId, amount: splitAmount });
            totalSplit += splitAmount;
          }
        });
        
        // Validate total split matches expense amount
        if (Math.abs(totalSplit - amount) > 0.01) {
          showNotification('The sum of split amounts must equal the total expense amount.', 'error');
          return;
        }
      } 
      else if (splitType === 'percentage') {
        // Percentage split
        let totalPercentage = 0;
        selectedMemberIds.forEach(memberId => {
          const percentage = parseFloat(document.getElementById(`split-${memberId}`).value);
          if (!isNaN(percentage)) {
            const splitAmount = (percentage / 100) * amount;
            splits.push({ id: memberId, amount: splitAmount, percentage });
            totalPercentage += percentage;
          }
        });
        
        // Validate percentages add up to 100%
        if (Math.abs(totalPercentage - 100) > 0.01) {
          showNotification('The percentages must add up to 100%.', 'error');
          return;
        }
      }
      else if (splitType === 'shares') {
        // Shares split
        let totalShares = 0;
        const shareValues = {};
        
        // First, calculate total shares
        selectedMemberIds.forEach(memberId => {
          const shares = parseInt(document.getElementById(`split-${memberId}`).value) || 1;
          shareValues[memberId] = shares;
          totalShares += shares;
        });
        
        // Then, calculate amount per share and assign
        const amountPerShare = amount / totalShares;
        selectedMemberIds.forEach(memberId => {
          const memberShares = shareValues[memberId];
          splits.push({ 
            id: memberId, 
            amount: amountPerShare * memberShares, 
            shares: memberShares 
          });
        });
      }
      else if (splitType === 'adjustment') {
        // Equal split with adjustments
        const baseShare = amount / selectedMemberIds.length;
        let totalAdjustments = 0;
        const adjustedShares = {};
        
        // Calculate all adjustments
        selectedMemberIds.forEach(memberId => {
          const adjustment = parseFloat(document.getElementById(`split-${memberId}`).value) || 0;
          adjustedShares[memberId] = baseShare + adjustment;
          totalAdjustments += adjustment;
        });
        
        // Validate adjustments sum to zero
        if (Math.abs(totalAdjustments) > 0.01) {
          showNotification('The sum of all adjustments must equal zero.', 'error');
          return;
        }
        
        // Apply adjusted shares
        selectedMemberIds.forEach(memberId => {
          splits.push({ 
            id: memberId, 
            amount: adjustedShares[memberId],
            adjustment: parseFloat(document.getElementById(`split-${memberId}`).value) || 0
          });
        });
      }
      break;
      
    case 'exclude':
      // Equal split among only the selected members
      const excludedShare = amount / selectedMemberIds.length;
      selectedMemberIds.forEach(memberId => {
        splits.push({ id: memberId, amount: excludedShare });
      });
      break;
  }
  
  // Create new expense object
  const newExpense = {
    id: generateId(),
    description,
    amount,
    category,
    date,
    notes,
    payers,
    splits,
    splitType,
    createdAt: new Date().toISOString(),
    createdBy: currentUser.id
  };
  
  // Add to group expenses
  group.expenses.push(newExpense);
  
  // Update last activity
  group.lastActivity = new Date().toISOString();
  
  // Save changes
  saveGroups();
  
  // Close modal and update UI
  closeModal('add-expense-modal');
  showExpensesEnhanced();
  
  // Show notification
  showNotification('Expense added successfully!');
  
  // Update group stats
  loadGroupDetails(currentGroupId);
}

// Display expenses in the tab content
function showExpensesEnhanced() {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Set active tab
  setActiveTab('expenses');
  
  const tabContent = document.getElementById('tab-content');
  
  // Check if there are any expenses
  if (group.expenses.length === 0) {
    tabContent.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-receipt"></i>
        <h3>No Expenses Yet</h3>
        <p>Add your first expense to start tracking group spending.</p>
        <button class="primary-button" onclick="showModal('add-expense-modal')">
          <i class="fas fa-plus"></i> Add Expense
        </button>
      </div>
    `;
    return;
  }
  
  // Sort expenses by date (newest first)
  const sortedExpenses = [...group.expenses].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  
  // Start building the content
  let content = `
    <div class="section-header" style="margin-bottom: 1rem;">
      <h3>All Expenses</h3>
      <div class="search-container">
        <input type="text" id="expense-search" class="custom-input search-input" placeholder="Search expenses..." onkeyup="searchExpenses(this.value)">
        <select id="expense-sort" class="custom-input filter-dropdown" onchange="sortExpenses(this.value)">
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>
      </div>
    </div>
    
    <div id="expenses-list">
  `;
  
  // Add each expense
  sortedExpenses.forEach(expense => {
    // Get payer names
    const primaryPayer = group.members.find(m => m.id === expense.payers[0]?.id);
    const payerName = primaryPayer ? primaryPayer.name : 'Unknown';
    const multiplePayers = expense.payers.length > 1;
    
    content += `
      <div class="expense-item" onclick="viewExpenseDetails('${expense.id}')">
        <div class="expense-header">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="expense-icon category-${expense.category}">
              <i class="fas fa-${getCategoryIcon(expense.category)}"></i>
            </div>
            <div>
              <h4 class="expense-title">${expense.description}</h4>
              <div class="expense-meta">
                <span><i class="fas fa-calendar-alt"></i> ${formatDate(expense.date)}</span>
                <span><i class="fas fa-user"></i> ${payerName}${multiplePayers ? ' +' + (expense.payers.length - 1) : ''}</span>
              </div>
            </div>
          </div>
          <div class="expense-amount">${group.currency}${parseFloat(expense.amount).toFixed(2)}</div>
        </div>
        <div class="expense-details">
          <div>
            <span class="badge badge-${getSplitTypeBadge(expense.splitType)}">
              ${getSplitTypeLabel(expense.splitType)}
            </span>
            ${expense.notes ? `<span><i class="fas fa-sticky-note"></i> Note</span>` : ''}
          </div>
          <div>
            <span class="data-badge data-badge-${expense.category}">
              <i class="fas fa-${getCategoryIcon(expense.category)}"></i>
              ${getCategoryName(expense.category)}
            </span>
          </div>
        </div>
      </div>
    `;
  });
  
  // Close the list div and set the content
  content += '</div>';
  tabContent.innerHTML = content;
}

function getSplitTypeBadge(splitType) {
  switch (splitType) {
    case 'equal': return 'success';
    case 'unequal': return 'warning';
    case 'percentage': return 'warning';
    case 'shares': return 'primary';
    case 'adjustment': return 'warning';
    case 'exclude': return 'danger';
    default: return 'success';
  }
}

function getCategoryName(category) {
  switch (category) {
    case 'food': return 'Food & Drinks';
    case 'transportation': return 'Transportation';
    case 'accommodation': return 'Accommodation';
    case 'activities': return 'Activities';
    case 'shopping': return 'Shopping';
    case 'utilities': return 'Utilities';
    default: return 'Other';
  }
}

function getCategoryIcon(category) {
  switch (category) {
    case 'food': return 'utensils';
    case 'transportation': return 'car';
    case 'accommodation': return 'home';
    case 'activities': return 'hiking';
    case 'shopping': return 'shopping-bag';
    case 'utilities': return 'bolt';
    case 'trip': return 'plane';
    case 'home': return 'home';
    case 'event': return 'calendar-alt';
    case 'project': return 'briefcase';
    default: return 'receipt';
  }
}

// Show balance tab
function showBalances() {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Set active tab
  setActiveTab('balances');
  
  const tabContent = document.getElementById('tab-content');
  
  // Calculate balances
  const balances = calculateGroupBalances(group.id);
  
  // Start building content
  let content = `
    <div class="section-header" style="margin-bottom: 1rem;">
      <h3>Current Balances</h3>
    </div>
    
    <div class="balance-cards">
  `;
  
  // Add each member's balance
  group.members.forEach(member => {
    const memberBalance = balances.find(b => b.memberId === member.id);
    const balance = memberBalance ? memberBalance.balance : 0;
    
    const balanceClass = balance > 0 ? 'balance-positive' : (balance < 0 ? 'balance-negative' : 'balance-neutral');
    const balanceText = balance > 0 ? 'to receive' : (balance < 0 ? 'to pay' : 'settled up');
    
    content += `
      <div class="balance-card">
        <div class="member-avatar">
          <i class="fas fa-user"></i>
        </div>
        <h3>${member.name}</h3>
        <div class="${balanceClass} balance-amount">${group.currency}${Math.abs(balance).toFixed(2)}</div>
        <div class="balance-status">${balanceText}</div>
        
        <div class="member-detail">
          <div class="detail-item">
            <span class="detail-label">Paid:</span>
            <span class="detail-value">${group.currency}${calculateTotalPaid(group.id, member.id).toFixed(2)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Spent:</span>
            <span class="detail-value">${group.currency}${calculateTotalSpent(group.id, member.id).toFixed(2)}</span>
          </div>
        </div>
        
        ${balance !== 0 ? `
          <button class="secondary-button" onclick="suggestSettlement('${member.id}')">
            <i class="fas fa-exchange-alt"></i> Settle Up
          </button>
        ` : ''}
      </div>
    `;
  });
  
  // Close balance cards and add simplified view
  content += `
    </div>
    
    <div class="section-header" style="margin: 2rem 0 1rem;">
      <h3>Suggested Settlements</h3>
    </div>
  `;
  
  // Calculate optimal settlements
  const settlements = calculateOptimalSettlements(group.id);
  
  if (settlements.length === 0) {
    content += `
      <div class="empty-state" style="padding: 1.5rem;">
        <i class="fas fa-check-circle"></i>
        <h3>All Settled Up!</h3>
        <p>There are no pending settlements in this group.</p>
      </div>
    `;
  } else {
    content += `<div class="settlement-list">`;
    
    settlements.forEach(settlement => {
      const fromMember = group.members.find(m => m.id === settlement.from);
      const toMember = group.members.find(m => m.id === settlement.to);
      
      content += `
        <div class="settlement-item">
          <div class="settlement-users">
            <span>${fromMember ? fromMember.name : 'Unknown'}</span>
            <i class="fas fa-arrow-right"></i>
            <span>${toMember ? toMember.name : 'Unknown'}</span>
          </div>
          <div class="settlement-amount">${group.currency}${settlement.amount.toFixed(2)}</div>
          <button class="secondary-button" onclick="recordSettlement('${settlement.from}', '${settlement.to}', ${settlement.amount})">
            <i class="fas fa-check"></i> Mark as Settled
          </button>
        </div>
      `;
    });
    
    content += `</div>`;
  }
  
  tabContent.innerHTML = content;
}

// Helper function to calculate user balance in a group
function calculateUserBalance(groupId, userId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return 0;
  
  let totalPaid = 0;
  let totalOwed = 0;
  
  // Calculate amount paid by this user
  group.expenses.forEach(expense => {
    // Sum up all amounts this user paid
    const userPayments = expense.payers.filter(p => p.id === userId);
    userPayments.forEach(payment => {
      totalPaid += parseFloat(payment.amount);
    });
    
    // Sum up all amounts this user owes
    const userSplits = expense.splits.filter(s => s.id === userId);
    userSplits.forEach(split => {
      totalOwed += parseFloat(split.amount);
    });
  });
  
  // Also consider completed settlements
  group.settlements.forEach(settlement => {
    if (settlement.from === userId) {
      // User paid someone, so reduce what they owe
      totalPaid += parseFloat(settlement.amount);
    }
    if (settlement.to === userId) {
      // User received payment, so reduce what they're owed
      totalOwed += parseFloat(settlement.amount);
    }
  });
  
  // Return balance (positive means user is owed money, negative means user owes money)
  return totalPaid - totalOwed;
}

// Calculate balances for all members in a group
function calculateGroupBalances(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return [];
  
  const balances = group.members.map(member => {
    return {
      memberId: member.id,
      memberName: member.name,
      balance: calculateUserBalance(groupId, member.id)
    };
  });
  
  return balances;
}

// Calculate total amount paid by a user in a group
function calculateTotalPaid(groupId, userId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return 0;
  
  let totalPaid = 0;
  
  // Sum payments from expenses
  group.expenses.forEach(expense => {
    const userPayments = expense.payers.filter(p => p.id === userId);
    userPayments.forEach(payment => {
      totalPaid += parseFloat(payment.amount);
    });
  });
  
  // Add settlements paid by user
  group.settlements.forEach(settlement => {
    if (settlement.from === userId) {
      totalPaid += parseFloat(settlement.amount);
    }
  });
  
  return totalPaid;
}

// Calculate total amount spent by a user in a group
function calculateTotalSpent(groupId, userId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return 0;
  
  let totalSpent = 0;
  
  // Sum all splits for this user
  group.expenses.forEach(expense => {
    const userSplits = expense.splits.filter(s => s.id === userId);
    userSplits.forEach(split => {
      totalSpent += parseFloat(split.amount);
    });
  });
  
  // Add settlements received by user
  group.settlements.forEach(settlement => {
    if (settlement.to === userId) {
      totalSpent += parseFloat(settlement.amount);
    }
  });
  
  return totalSpent;
}

// Calculate optimal settlements for a group
function calculateOptimalSettlements(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return [];
  
  // Get all member balances
  const balances = calculateGroupBalances(groupId);
  
  // Separate into debts (negative balances) and credits (positive balances)
  const debts = balances.filter(b => b.balance < 0)
    .sort((a, b) => a.balance - b.balance); // Sort by amount (most negative first)
  
  const credits = balances.filter(b => b.balance > 0)
    .sort((a, b) => b.balance - a.balance); // Sort by amount (most positive first)
  
  const settlements = [];
  
  // Match debts to credits
  for (let i = 0; i < debts.length; i++) {
    const debt = debts[i];
    let remainingDebt = Math.abs(debt.balance);
    
    for (let j = 0; j < credits.length; j++) {
      const credit = credits[j];
      
      if (credit.balance <= 0) continue;
      
      // Calculate settlement amount
      const amount = Math.min(remainingDebt, credit.balance);
      
      if (amount > 0.01) { // Only include non-trivial amounts
        settlements.push({
          from: debt.memberId,
          to: credit.memberId,
          amount: amount
        });
        
        // Update remaining balances
        remainingDebt -= amount;
        credits[j].balance -= amount;
      }
      
      if (remainingDebt < 0.01) break;
    }
  }
  
  return settlements;
}

// Helper function to set active tab
function setActiveTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  // Find the button that corresponds to this tab and make it active
  const tabButtons = document.querySelectorAll('.tab-button');
  for (let i = 0; i < tabButtons.length; i++) {
    if (tabButtons[i].textContent.toLowerCase().includes(tabName)) {
      tabButtons[i].classList.add('active');
      break;
    }
  }
}

// ===============================
// SETTLEMENTS & MEMBER MANAGEMENT
// ===============================

// Populate the settle-up modal with members and default values
function populateSettleUpModal() {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Populate from and to dropdowns
  const fromSelect = document.getElementById('settlement-from');
  const toSelect = document.getElementById('settlement-to');
  
  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';
  
  group.members.forEach(member => {
    const fromOption = document.createElement('option');
    fromOption.value = member.id;
    fromOption.textContent = member.name;
    
    const toOption = document.createElement('option');
    toOption.value = member.id;
    toOption.textContent = member.name;
    
    fromSelect.appendChild(fromOption);
    toSelect.appendChild(toOption);
  });
  
  // Set default date to today
  document.getElementById('settlement-date').value = new Date().toISOString().split('T')[0];
}

// Pre-fill the settle-up modal for a suggested settlement
function suggestSettlement(memberId) {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  const member = group.members.find(m => m.id === memberId);
  if (!member) return;
  
  // Calculate current balance for this member
  const balance = calculateUserBalance(currentGroupId, memberId);
  
  // Open the settle up modal
  showModal('settle-up-modal');
  
  // Wait for modal to fully open then populate
  setTimeout(() => {
    if (balance < 0) {
      // Member owes money, they should be the "from" person
      document.getElementById('settlement-from').value = memberId;
      
      // Find someone they owe money to (a member with positive balance)
      const creditor = calculateGroupBalances(currentGroupId)
        .find(b => b.balance > 0);
      
      if (creditor) {
        document.getElementById('settlement-to').value = creditor.memberId;
      }
      
      // Set suggested amount
      document.getElementById('settlement-amount').value = Math.abs(balance).toFixed(2);
    } else if (balance > 0) {
      // Member is owed money, they should be the "to" person
      document.getElementById('settlement-to').value = memberId;
      
      // Find someone who owes them money (a member with negative balance)
      const debtor = calculateGroupBalances(currentGroupId)
        .find(b => b.balance < 0);
      
      if (debtor) {
        document.getElementById('settlement-from').value = debtor.memberId;
      }
      
      // Set suggested amount
      document.getElementById('settlement-amount').value = balance.toFixed(2);
    }
  }, 100);
}

// Record a settlement between two members
function recordSettlement(fromId, toId, amount) {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  const fromMember = group.members.find(m => m.id === fromId);
  const toMember = group.members.find(m => m.id === toId);
  
  if (!fromMember || !toMember) {
    showNotification('Member not found.', 'error');
    return;
  }
  
  const newSettlement = {
    id: generateId(),
    from: fromId,
    to: toId,
    amount: parseFloat(amount),
    date: new Date().toISOString().split('T')[0],
    notes: `Settlement from ${fromMember.name} to ${toMember.name}`,
    createdAt: new Date().toISOString(),
    createdBy: currentUser.id
  };
  
  // Add to group settlements
  group.settlements.push(newSettlement);
  
  // Update last activity
  group.lastActivity = new Date().toISOString();
  
  // Save changes
  saveGroups();
  
  // Show notification
  showNotification('Settlement recorded successfully!');
  
  // Refresh the balances view
  showBalances();
}

// Handle the settle up form submission
function handleSettleUp(e) {
  e.preventDefault();
  
  const fromId = document.getElementById('settlement-from').value;
  const toId = document.getElementById('settlement-to').value;
  const amount = parseFloat(document.getElementById('settlement-amount').value);
  const date = document.getElementById('settlement-date').value;
  const notes = document.getElementById('settlement-notes').value;
  
  if (fromId === toId) {
    showNotification('Cannot settle up with yourself.', 'error');
    return;
  }
  
  if (!amount || amount <= 0) {
    showNotification('Please enter a valid amount.', 'error');
    return;
  }
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  const fromMember = group.members.find(m => m.id === fromId);
  const toMember = group.members.find(m => m.id === toId);
  
  const newSettlement = {
    id: generateId(),
    from: fromId,
    to: toId,
    amount,
    date,
    notes,
    createdAt: new Date().toISOString(),
    createdBy: currentUser.id
  };
  
  // Add to group settlements
  group.settlements.push(newSettlement);
  
  // Update last activity
  group.lastActivity = new Date().toISOString();
  
  // Save changes
  saveGroups();
  
  // Close modal
  closeModal('settle-up-modal');
  
  // Show notification
  showNotification(`Settlement of ${group.currency}${amount.toFixed(2)} recorded successfully!`);
  
  // Refresh the balances view if that's what's showing
  const activeTab = document.querySelector('.tab-button.active');
  if (activeTab && activeTab.textContent.toLowerCase().includes('balance')) {
    showBalances();
  }
}

// Handle adding a new member to a group
function handleAddMember(e) {
  e.preventDefault();
  
  const name = document.getElementById('member-name').value;
  const email = document.getElementById('member-email').value;
  
  if (!name) {
    showNotification('Please enter a name for the member.', 'error');
    return;
  }
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Check if a member with this name already exists
  if (group.members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
    showNotification('A member with this name already exists.', 'error');
    return;
  }
  
  // Create new member
  const newMember = {
    id: generateId(),
    name,
    email
  };
  
  // Add to group members
  group.members.push(newMember);
  
  // Update last activity
  group.lastActivity = new Date().toISOString();
  
  // Save changes
  saveGroups();
  
  // Close modal
  closeModal('add-member-modal');
  
  // Show notification
  showNotification(`Member "${name}" added successfully!`);
  
  // Refresh the current view
  loadGroupDetails(currentGroupId);
  
  // If showing balances, refresh those
  const activeTab = document.querySelector('.tab-button.active');
  if (activeTab && activeTab.textContent.toLowerCase().includes('balance')) {
    showBalances();
  }
}

// ===============================
// ANALYTICS & VISUALIZATION
// ===============================

// Show analytics tab with charts and insights
function showAnalytics() {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Set active tab
  setActiveTab('analytics');
  
  const tabContent = document.getElementById('tab-content');
  
  // Check if there are any expenses
  if (group.expenses.length === 0) {
    tabContent.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-chart-bar"></i>
        <h3>No Data to Analyze</h3>
        <p>Add some expenses to see analytics and insights.</p>
        <button class="primary-button" onclick="showModal('add-expense-modal')">
          <i class="fas fa-plus"></i> Add Expense
        </button>
      </div>
    `;
    return;
  }
  
  // Build analytics content with charts
  let content = `
    <div class="analytics-summary">
      <div class="summary-card">
        <div class="summary-icon"><i class="fas fa-receipt"></i></div>
        <div class="summary-value">${group.expenses.length}</div>
        <div class="summary-subtitle">Total Expenses</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon"><i class="fas fa-wallet"></i></div>
        <div class="summary-value">${group.currency}${calculateTotalExpenses(group.id).toFixed(2)}</div>
        <div class="summary-subtitle">Total Spent</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon"><i class="fas fa-chart-line"></i></div>
        <div class="summary-value">${group.currency}${calculateAverageExpense(group.id).toFixed(2)}</div>
        <div class="summary-subtitle">Avg. Expense</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon"><i class="fas fa-calendar-day"></i></div>
        <div class="summary-value">${getMostRecentExpenseDate(group.id)}</div>
        <div class="summary-subtitle">Latest Expense</div>
      </div>
    </div>
    
    <div class="analytics-charts">
      <div class="chart-container">
        <h3>Expenses by Category</h3>
        <canvas id="category-chart"></canvas>
      </div>
      <div class="chart-container">
        <h3>Spending Over Time</h3>
        <canvas id="time-chart"></canvas>
      </div>
    </div>
    
    <div class="analytics-insights">
      <h3>Insights</h3>
      <div class="insights-container">
        ${generateInsights(group.id).map(insight => `
          <div class="insight-card">
            <div class="insight-icon"><i class="fas fa-${insight.icon}"></i></div>
            <div class="insight-text">${insight.text}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  tabContent.innerHTML = content;
  
  // Initialize charts after content is added to DOM
  setTimeout(() => {
    initializeCategoryChart(group.id);
    initializeTimeChart(group.id);
  }, 100);
}

// Helper function to calculate total expenses in a group
function calculateTotalExpenses(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return 0;
  
  return group.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
}

// Helper function to calculate average expense in a group
function calculateAverageExpense(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group || group.expenses.length === 0) return 0;
  
  const total = calculateTotalExpenses(groupId);
  return total / group.expenses.length;
}

// Helper function to get the most recent expense date
function getMostRecentExpenseDate(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group || group.expenses.length === 0) return 'N/A';
  
  const sortedExpenses = [...group.expenses].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  
  return formatDate(sortedExpenses[0].date);
}

// Initialize the category chart
function initializeCategoryChart(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return;
  
  // Get expense totals by category
  const categoryTotals = {};
  
  group.expenses.forEach(expense => {
    const category = expense.category;
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }
    categoryTotals[category] += parseFloat(expense.amount);
  });
  
  // Prepare data for chart
  const categories = Object.keys(categoryTotals);
  const amounts = categories.map(cat => categoryTotals[cat]);
  
  // Define colors for each category
  const colors = {
    food: '#e67e22',
    transportation: '#3498db',
    accommodation: '#9b59b6',
    activities: '#2ecc71',
    shopping: '#f1c40f',
    utilities: '#1abc9c',
    other: '#95a5a6'
  };
  
  // Create chart
  const ctx = document.getElementById('category-chart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories.map(cat => getCategoryName(cat)),
      datasets: [{
        data: amounts,
        backgroundColor: categories.map(cat => colors[cat] || '#95a5a6'),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${group.currency}${value.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}

// Initialize the time chart (expenses over time)
function initializeTimeChart(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return;
  
  // Get all expense dates and sort them
  const expenseDates = group.expenses.map(expense => expense.date);
  const uniqueDates = [...new Set(expenseDates)].sort();
  
  // Calculate cumulative spending by date
  const cumulativeSpending = [];
  let runningTotal = 0;
  
  uniqueDates.forEach(date => {
    const expensesOnDate = group.expenses.filter(expense => expense.date === date);
    const totalOnDate = expensesOnDate.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    runningTotal += totalOnDate;
    cumulativeSpending.push(runningTotal);
  });
  
  // Create chart
  const ctx = document.getElementById('time-chart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: uniqueDates.map(date => formatDate(date)),
      datasets: [{
        label: 'Cumulative Spending',
        data: cumulativeSpending,
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return group.currency + value;
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              return `${label}: ${group.currency}${value.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}

// Generate insights based on expense data
function generateInsights(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return [];
  
  const insights = [];
  
  // Calculate some stats
  const totalExpenses = calculateTotalExpenses(groupId);
  const avgExpense = calculateAverageExpense(groupId);
  
  // Get category breakdown
  const categoryTotals = {};
  group.expenses.forEach(expense => {
    const category = expense.category;
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }
    categoryTotals[category] += parseFloat(expense.amount);
  });
  
  // Find top category
  let topCategory = '';
  let topAmount = 0;
  Object.entries(categoryTotals).forEach(([category, amount]) => {
    if (amount > topAmount) {
      topCategory = category;
      topAmount = amount;
    }
  });
  
  // Add insights if we have enough data
  if (group.expenses.length > 0) {
    insights.push({
      icon: 'chart-pie',
      text: `${getCategoryName(topCategory)} is your top spending category (${(topAmount / totalExpenses * 100).toFixed(0)}% of total)`
    });
  }
  
  if (group.expenses.length > 5) {
    insights.push({
      icon: 'calculator',
      text: `The average expense is ${group.currency}${avgExpense.toFixed(2)}`
    });
  }
  
  // Find member who paid the most
  const memberPayments = {};
  group.expenses.forEach(expense => {
    expense.payers.forEach(payer => {
      if (!memberPayments[payer.id]) {
        memberPayments[payer.id] = 0;
      }
      memberPayments[payer.id] += parseFloat(payer.amount);
    });
  });
  
  let topPayerId = '';
  let topPayment = 0;
  Object.entries(memberPayments).forEach(([memberId, amount]) => {
    if (amount > topPayment) {
      topPayerId = memberId;
      topPayment = amount;
    }
  });
  
  const topPayer = group.members.find(m => m.id === topPayerId);
  if (topPayer) {
    insights.push({
      icon: 'trophy',
      text: `${topPayer.name} has paid the most (${group.currency}${topPayment.toFixed(2)})`
    });
  }
  
  // If there aren't enough insights, add some generic ones
  if (insights.length < 3) {
    insights.push({
      icon: 'lightbulb',
      text: 'For more detailed insights, try adding more expenses'
    });
  }
  
  if (group.budgets && group.budgets.length === 0) {
    insights.push({
      icon: 'piggy-bank',
      text: 'Try setting budgets to track your spending goals'
    });
  }
  
  return insights;
}

// ===============================
// SETTLEMENTS & BUDGETS
// ===============================

// Show settlements tab
function showSettlements() {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Set active tab
  setActiveTab('settlements');
  
  const tabContent = document.getElementById('tab-content');
  
  // Check if there are any settlements
  if (group.settlements.length === 0) {
    tabContent.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exchange-alt"></i>
        <h3>No Settlements Yet</h3>
        <p>Record settlements when members pay each other.</p>
        <button class="primary-button" onclick="showModal('settle-up-modal')">
          <i class="fas fa-exchange-alt"></i> Record Settlement
        </button>
      </div>
    `;
    return;
  }
  
  // Sort settlements by date (newest first)
  const sortedSettlements = [...group.settlements].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  
  // Start building content
  let content = `
    <div class="section-header" style="margin-bottom: 1rem;">
      <h3>Settlement History</h3>
      <button class="secondary-button" onclick="showModal('settle-up-modal')">
        <i class="fas fa-plus"></i> New Settlement
      </button>
    </div>
    
    <div class="settlements-list">
  `;
  
  // Add each settlement
  sortedSettlements.forEach(settlement => {
    const fromMember = group.members.find(m => m.id === settlement.from) || { name: 'Unknown' };
    const toMember = group.members.find(m => m.id === settlement.to) || { name: 'Unknown' };
    
    content += `
      <div class="settlement-item">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="expense-icon">
            <i class="fas fa-exchange-alt"></i>
          </div>
          <div>
            <h4>${fromMember.name} paid ${toMember.name}</h4>
            <div class="expense-meta">
              <span><i class="fas fa-calendar-alt"></i> ${formatDate(settlement.date)}</span>
              ${settlement.notes ? `<span><i class="fas fa-sticky-note"></i> ${settlement.notes}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="expense-amount">${group.currency}${parseFloat(settlement.amount).toFixed(2)}</div>
      </div>
    `;
  });
  
  // Close the list div and set the content
  content += '</div>';
  tabContent.innerHTML = content;
}

// Show budgets tab
function showBudgets() {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Create budgets array if it doesn't exist
  if (!group.budgets) {
    group.budgets = [];
  }
  
  // Set active tab
  setActiveTab('budgets');
  
  const tabContent = document.getElementById('tab-content');
  
  // Check if there are any budgets
  if (group.budgets.length === 0) {
    tabContent.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-piggy-bank"></i>
        <h3>No Budgets Yet</h3>
        <p>Create budgets to track and manage your group's spending.</p>
        <button class="primary-button" onclick="showModal('add-budget-modal')">
          <i class="fas fa-plus"></i> Add Budget
        </button>
      </div>
    `;
    return;
  }
  
  // Start building content
  let content = `
    <div class="section-header" style="margin-bottom: 1rem;">
      <h3>Group Budgets</h3>
      <button class="secondary-button" onclick="showModal('add-budget-modal')">
        <i class="fas fa-plus"></i> Add Budget
      </button>
    </div>
    
    <div class="budget-cards">
  `;
  
  // Add each budget
  group.budgets.forEach(budget => {
    // Calculate spent amount for this budget based on category
    let spent = 0;
    if (budget.category === 'all') {
      // All expenses
      spent = group.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    } else {
      // Only expenses in this category
      spent = group.expenses
        .filter(expense => expense.category === budget.category)
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    }
    
    const remaining = budget.amount - spent;
    const percentUsed = (spent / budget.amount * 100).toFixed(0);
    const isOverBudget = spent > budget.amount;
    
    content += `
      <div class="budget-card">
        <div class="budget-header">
          <h3>${budget.name}</h3>
          <div class="icon-button" onclick="deleteBudget('${budget.id}')">
            <i class="fas fa-trash"></i>
          </div>
        </div>
        
        <div class="budget-details">
          <div class="budget-amount">
            <div class="label">Budget</div>
            <div class="value">${group.currency}${parseFloat(budget.amount).toFixed(2)}</div>
          </div>
          
          <div class="budget-spent">
            <div class="label">Spent</div>
            <div class="value">${group.currency}${spent.toFixed(2)}</div>
          </div>
          
          <div class="budget-remaining ${isOverBudget ? 'over-budget' : ''}">
            <div class="label">Remaining</div>
            <div class="value">${isOverBudget ? '-' : ''}${group.currency}${Math.abs(remaining).toFixed(2)}</div>
          </div>
        </div>
        
        <div class="budget-progress">
          <div class="progress-bar">
            <div class="progress" style="width: ${Math.min(percentUsed, 100)}%; background-color: ${isOverBudget ? 'var(--danger)' : 'var(--primary-color)'}"></div>
          </div>
          <div class="progress-text">${percentUsed}% used</div>
        </div>
        
        <div class="budget-meta">
          <span><i class="fas fa-${getCategoryIcon(budget.category)}"></i> ${budget.category === 'all' ? 'All Categories' : getCategoryName(budget.category)}</span>
          <span><i class="fas fa-clock"></i> ${getBudgetTimeframeText(budget)}</span>
        </div>
        
        ${budget.notes ? `
          <div class="budget-notes">
            <i class="fas fa-sticky-note"></i>
            <p>${budget.notes}</p>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  // Close the budget cards div and set the content
  content += '</div>';
  tabContent.innerHTML = content;
}

function getBudgetTimeframeText(budget) {
  switch(budget.period) {
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
    case 'yearly': return 'Yearly';
    case 'custom': return `${formatDate(budget.startDate)} - ${formatDate(budget.endDate)}`;
    default: return 'Monthly';
  }
}

// Function to add a budget
function addBudget() {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Get form values
  const name = document.getElementById('budget-name').value;
  const amount = parseFloat(document.getElementById('budget-amount').value);
  const category = document.getElementById('budget-category').value;
  const period = document.getElementById('budget-period').value;
  const notes = document.getElementById('budget-notes').value;
  
  // Validate required fields
  if (!name || !amount || amount <= 0) {
    showNotification('Please enter a name and valid amount for the budget.', 'error');
    return;
  }
  
  // Handle custom date range
  let startDate = null;
  let endDate = null;
  
  if (period === 'custom') {
    startDate = document.getElementById('budget-start-date').value;
    endDate = document.getElementById('budget-end-date').value;
    
    if (!startDate || !endDate) {
      showNotification('Please select start and end dates for the custom period.', 'error');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      showNotification('Start date must be before end date.', 'error');
      return;
    }
  }
  
  // Create new budget
  const newBudget = {
    id: generateId(),
    name,
    amount,
    category,
    period,
    startDate,
    endDate,
    notes,
    createdAt: new Date().toISOString(),
    createdBy: currentUser.id
  };
  
  // Create budgets array if it doesn't exist
  if (!group.budgets) {
    group.budgets = [];
  }
  
  // Add to group budgets
  group.budgets.push(newBudget);
  
  // Update last activity
  group.lastActivity = new Date().toISOString();
  
  // Save changes
  saveGroups();
  
  // Close modal
  closeModal('add-budget-modal');
  
  // Show notification
  showNotification('Budget added successfully!');
  
  // Refresh budgets view
  showBudgets();
}

// Function to delete a budget
function deleteBudget(budgetId) {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group || !group.budgets) return;
  
  // Find budget index
  const budgetIndex = group.budgets.findIndex(b => b.id === budgetId);
  
  if (budgetIndex === -1) {
    showNotification('Budget not found.', 'error');
    return;
  }
  
  // Confirm deletion
  if (confirm('Are you sure you want to delete this budget?')) {
    // Remove from array
    group.budgets.splice(budgetIndex, 1);
    
    // Update last activity
    group.lastActivity = new Date().toISOString();
    
    // Save changes
    saveGroups();
    
    // Show notification
    showNotification('Budget deleted successfully.');
    
    // Refresh budgets view
    showBudgets();
  }
}

// Function to toggle budget period fields
function toggleBudgetPeriod() {
  const periodSelect = document.getElementById('budget-period');
  const customDateRange = document.getElementById('custom-date-range');
  
  if (periodSelect.value === 'custom') {
    customDateRange.style.display = 'grid';
  } else {
    customDateRange.style.display = 'none';
  }
}

// ===============================
// WALLET MANAGEMENT
// ===============================

// Function to add funds to wallet
function addFunds() {
  const amount = parseFloat(document.getElementById('funds-amount').value);
  const method = document.getElementById('payment-method').value;
  const notes = document.getElementById('funds-notes').value;
  
  // Validate amount
  if (!amount || amount <= 0) {
    showNotification('Please enter a valid amount.', 'error');
    return;
  }
  
  // Create transaction
  const transaction = {
    id: generateId(),
    type: 'add',
    amount,
    method,
    notes,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  };
  
  // Update wallet balance
  currentUser.wallet.balance += amount;
  currentUser.wallet.transactions.push(transaction);
  
  // Save user data
  saveUserData();
  
  // Close modal
  closeModal('add-funds-modal');
  
  // Show notification
  showNotification(`${formatCurrency(amount)} added to your wallet!`);
  
  // Update wallet display
  updateDashboard();
  
  // Update wallet dashboard if visible
  if (document.getElementById('wallet').classList.contains('active')) {
    updateWalletDashboard();
  }
}

// Function to show transaction history
function showTransactionHistory() {
  const container = document.getElementById('transactions-container');
  
  if (!currentUser.wallet.transactions || currentUser.wallet.transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 1rem;">
        <p>No transactions yet.</p>
      </div>
    `;
    return;
  }
  
  // Sort transactions by date (newest first)
  const sortedTransactions = [...currentUser.wallet.transactions].sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  // Render transactions
  let html = '';
  
  sortedTransactions.forEach(transaction => {
    const transactionType = transaction.type;
    let icon, title;
    
    switch(transactionType) {
      case 'add':
        icon = 'plus-circle';
        title = `Added funds (${transaction.method})`;
        break;
      case 'payment':
        icon = 'arrow-up';
        title = `Payment to ${transaction.recipient || 'someone'}`;
        break;
      case 'received':
        icon = 'arrow-down';
        title = `Received from ${transaction.sender || 'someone'}`;
        break;
      default:
        icon = 'exchange-alt';
        title = 'Transaction';
    }
    
    html += `
      <div class="transaction-item">
        <div class="transaction-icon ${transactionType}">
          <i class="fas fa-${icon}"></i>
        </div>
        <div class="transaction-details">
          <div class="transaction-title">${title}</div>
          <div class="transaction-meta">
            ${formatDate(transaction.date)} · ${transaction.notes || 'No notes'}
          </div>
        </div>
        <div class="transaction-amount ${transactionType}">
          ${transactionType === 'add' || transactionType === 'received' ? '+' : '-'}
          ${formatCurrency(transaction.amount)}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Also update mini transactions list in wallet dashboard
  updateRecentTransactions(sortedTransactions.slice(0, 3));
}

// Function to update recent transactions in wallet dashboard
function updateRecentTransactions(transactions) {
  const container = document.getElementById('recent-transactions');
  if (!container) return;
  
  if (!transactions || transactions.length === 0) {
    container.innerHTML = `<div class="empty-transactions-message">No recent transactions</div>`;
    return;
  }
  
  let html = `<div class="mini-transaction-list">`;
  
  transactions.forEach(transaction => {
    const transactionType = transaction.type;
    let icon, title;
    
    switch(transactionType) {
      case 'add':
        icon = 'plus-circle';
        title = `Added funds`;
        break;
      case 'payment':
        icon = 'arrow-up';
        title = `Payment`;
        break;
      case 'received':
        icon = 'arrow-down';
        title = `Received`;
        break;
      default:
        icon = 'exchange-alt';
        title = 'Transaction';
    }
    
    html += `
      <div class="mini-transaction-item">
        <div class="mini-transaction-icon ${transactionType}">
          <i class="fas fa-${icon}"></i>
        </div>
        <div class="mini-transaction-info">
          <div class="mini-transaction-title">${title}</div>
          <div class="mini-transaction-date">${formatDate(transaction.date)}</div>
        </div>
        <div class="mini-transaction-amount ${transactionType}">
          ${transactionType === 'add' || transactionType === 'received' ? '+' : '-'}
          ${formatCurrency(transaction.amount)}
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = html;
}

// Function to initialize wallet spending chart
function initializeWalletSpendingChart() {
  const chartCanvas = document.getElementById('wallet-spending-chart');
  if (!chartCanvas) return;
  
  // Get transactions data for chart
  const transactions = currentUser.wallet.transactions || [];
  
  // Last 7 days dates
  const dates = [];
  const moneyIn = [];
  const moneyOut = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(formatDate(date.toISOString().split('T')[0]));
    
    // Find transactions for this date
    const dateStr = date.toISOString().split('T')[0];
    const inTransactions = transactions.filter(t => 
      (t.date === dateStr) && (t.type === 'add' || t.type === 'received')
    );
    const outTransactions = transactions.filter(t => 
      (t.date === dateStr) && (t.type === 'payment')
    );
    
    // Calculate total for the day
    const totalIn = inTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalOut = outTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    moneyIn.push(totalIn);
    moneyOut.push(totalOut);
  }
  
  // Create chart
  new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Money In',
          data: moneyIn,
          borderColor: 'rgba(79, 70, 229, 0.7)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        },
        {
          label: 'Money Out',
          data: moneyOut,
          borderColor: 'rgba(244, 63, 94, 0.7)',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              return `${label}: ${formatCurrency(value)}`;
            }
          }
        }
      },
      maintainAspectRatio: false
    }
  });
}

// ===============================
// EXPENSE DETAILS
// ===============================

// Function to view detailed expense information
function viewExpenseDetails(expenseId) {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  const expense = group.expenses.find(e => e.id === expenseId);
  if (!expense) {
    showNotification('Expense not found.', 'error');
    return;
  }
  
  // Get payer and split information
  let payerContent = '';
  
  if (expense.payers.length === 1) {
    const payer = group.members.find(m => m.id === expense.payers[0].id);
    payerContent = `<p><strong>Paid by:</strong> ${payer ? payer.name : 'Unknown'}</p>`;
  } else {
    payerContent = `
      <p><strong>Multiple payers:</strong></p>
      <div class="payers-list-detail">
        ${expense.payers.map(payer => {
          const member = group.members.find(m => m.id === payer.id);
          return `
            <div class="payer-detail-item">
              <span>${member ? member.name : 'Unknown'}</span>
              <span>${group.currency}${parseFloat(payer.amount).toFixed(2)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Get split details
  let splitContent = `
    <p><strong>Split type:</strong> <span class="expense-split-type">${getSplitTypeLabel(expense.splitType)}</span></p>
    <div class="splits-list">
      ${expense.splits.map(split => {
        const member = group.members.find(m => m.id === split.id);
        return `
          <div class="split-detail-item">
            <span>${member ? member.name : 'Unknown'}</span>
            <span>${group.currency}${parseFloat(split.amount).toFixed(2)}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  // Build modal content
  const modalContent = document.getElementById('expense-detail-content');
  modalContent.innerHTML = `
    <div class="expense-detail-header">
      <h2>${expense.description}</h2>
      <div class="expense-detail-amount">${group.currency}${parseFloat(expense.amount).toFixed(2)}</div>
    </div>
    
    <div class="expense-detail-badge">
      <i class="fas fa-${getCategoryIcon(expense.category)}"></i>
      ${getCategoryName(expense.category)}
    </div>
    
    <div class="expense-detail-info">
      <div class="detail-item">
        <span class="detail-label"><i class="fas fa-calendar-alt"></i> Date:</span>
        <span class="detail-value">${formatDate(expense.date)}</span>
      </div>
      
      <div class="detail-section">
        <h4>Payment Details</h4>
        ${payerContent}
      </div>
      
      <div class="detail-section">
        <h4>Split Details</h4>
        ${splitContent}
      </div>
      
      ${expense.notes ? `
        <div class="detail-section">
          <h4>Notes</h4>
          <div class="detail-notes">${expense.notes}</div>
        </div>
      ` : ''}
      
      <div class="detail-item">
        <span class="detail-label"><i class="fas fa-clock"></i> Added:</span>
        <span class="detail-value">${formatDate(expense.createdAt)}</span>
      </div>
    </div>
    
    <div class="expense-detail-actions">
      <button class="secondary-button" onclick="editExpense('${expense.id}')">
        <i class="fas fa-edit"></i> Edit
      </button>
      <button class="danger-button" onclick="deleteExpense('${expense.id}')">
        <i class="fas fa-trash"></i> Delete
      </button>
    </div>
  `;
  
  // Show modal
  showModal('expense-detail-modal');
}

// Delete an expense
function deleteExpense(expenseId) {
  // Close the expense detail modal first
  closeModal('expense-detail-modal');
  
  if (confirm('Are you sure you want to delete this expense?')) {
    const group = groups.find(g => g.id === currentGroupId);
    if (!group) return;
    
    // Find expense index
    const expenseIndex = group.expenses.findIndex(e => e.id === expenseId);
    
    if (expenseIndex === -1) {
      showNotification('Expense not found.', 'error');
      return;
    }
    
    // Remove expense
    group.expenses.splice(expenseIndex, 1);
    
    // Update last activity
    group.lastActivity = new Date().toISOString();
    
    // Save changes
    saveGroups();
    
    // Show notification
    showNotification('Expense deleted successfully.');
    
    // Refresh the current view
    showExpensesEnhanced();
    
    // Update group stats
    loadGroupDetails(currentGroupId);
  }
}

// Function to filter/search expenses
function searchExpenses(query) {
  const expenses = document.getElementById('expenses-list').querySelectorAll('.expense-item');
  
  query = query.toLowerCase();
  
  expenses.forEach(expense => {
    const title = expense.querySelector('.expense-title').textContent.toLowerCase();
    const meta = expense.querySelector('.expense-meta').textContent.toLowerCase();
    
    if (title.includes(query) || meta.includes(query)) {
      expense.style.display = 'block';
    } else {
      expense.style.display = 'none';
    }
  });
}

// Function to sort expenses
function sortExpenses(sortMethod) {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  let sortedExpenses = [...group.expenses];
  
  switch(sortMethod) {
    case 'date-desc': // Newest first
      sortedExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case 'date-asc': // Oldest first
      sortedExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'amount-desc': // Highest amount first
      sortedExpenses.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
      break;
    case 'amount-asc': // Lowest amount first
      sortedExpenses.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
      break;
  }
  
  // Re-render expenses list
  const expensesList = document.getElementById('expenses-list');
  expensesList.innerHTML = '';
  
  sortedExpenses.forEach(expense => {
    // Get payer names
    const primaryPayer = group.members.find(m => m.id === expense.payers[0]?.id);
    const payerName = primaryPayer ? primaryPayer.name : 'Unknown';
    const multiplePayers = expense.payers.length > 1;
    
    const expenseItem = document.createElement('div');
    expenseItem.className = 'expense-item';
    expenseItem.onclick = () => viewExpenseDetails(expense.id);
    
    expenseItem.innerHTML = `
      <div class="expense-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="expense-icon category-${expense.category}">
            <i class="fas fa-${getCategoryIcon(expense.category)}"></i>
          </div>
          <div>
            <h4 class="expense-title">${expense.description}</h4>
            <div class="expense-meta">
              <span><i class="fas fa-calendar-alt"></i> ${formatDate(expense.date)}</span>
              <span><i class="fas fa-user"></i> ${payerName}${multiplePayers ? ' +' + (expense.payers.length - 1) : ''}</span>
            </div>
          </div>
        </div>
        <div class="expense-amount">${group.currency}${parseFloat(expense.amount).toFixed(2)}</div>
      </div>
      <div class="expense-details">
        <div>
          <span class="badge badge-${getSplitTypeBadge(expense.splitType)}">
            ${getSplitTypeLabel(expense.splitType)}
          </span>
          ${expense.notes ? `<span><i class="fas fa-sticky-note"></i> Note</span>` : ''}
        </div>
        <div>
          <span class="data-badge data-badge-${expense.category}">
            <i class="fas fa-${getCategoryIcon(expense.category)}"></i>
            ${getCategoryName(expense.category)}
          </span>
        </div>
      </div>
    `;
    
    expensesList.appendChild(expenseItem);
  });
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

// Filter groups in the dashboard
function filterGroups() {
  const query = document.getElementById('group-search').value.toLowerCase();
  const groupCards = document.querySelectorAll('#groups-container .group-card');
  
  groupCards.forEach(card => {
    const groupName = card.querySelector('h3').textContent.toLowerCase();
    const groupMeta = card.querySelectorAll('.member-tag');
    let metaText = '';
    
    groupMeta.forEach(meta => {
      metaText += meta.textContent.toLowerCase() + ' ';
    });
    
    if (groupName.includes(query) || metaText.includes(query)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Sort groups in the dashboard
function sortGroups() {
  const sortMethod = document.getElementById('group-sort').value;
  const groupsContainer = document.getElementById('groups-container');
  const groupCards = Array.from(groupsContainer.querySelectorAll('.group-card'));
  
  // Sort based on selected method
  switch(sortMethod) {
    case 'recent':
      // Already sorted by recent activity by default
      break;
    case 'name':
      // Sort alphabetically
      groupCards.sort((a, b) => {
        const nameA = a.querySelector('h3').textContent;
        const nameB = b.querySelector('h3').textContent;
        return nameA.localeCompare(nameB);
      });
      break;
    case 'expenses':
      // Sort by total expenses (highest first)
      groupCards.sort((a, b) => {
        const expenseA = parseFloat(a.querySelector('.balance-amount').textContent.replace(/[^0-9.-]+/g, ''));
        const expenseB = parseFloat(b.querySelector('.balance-amount').textContent.replace(/[^0-9.-]+/g, ''));
        return expenseB - expenseA;
      });
      break;
  }
  
  // Clear and re-append in new order
  groupsContainer.innerHTML = '';
  groupCards.forEach(card => groupsContainer.appendChild(card));
}

// Copy group ID to clipboard
function copyGroupId() {
  const groupId = document.getElementById('group-unique-id').textContent;
  copyToClipboard(groupId);
  showNotification('Group ID copied to clipboard!');
}

// Copy group invite code to clipboard
function copyGroupCode() {
  const inviteCode = document.getElementById('group-invite-code').textContent;
  copyToClipboard(inviteCode);
  showNotification('Invite code copied to clipboard!');
}

// Copy user ID to clipboard
function copyUserId() {
  const userId = document.getElementById('profile-user-id').textContent;
  copyToClipboard(userId);
  showNotification('User ID copied to clipboard!');
}

// Generic copy to clipboard function
function copyToClipboard(text) {
  // Create a temporary input element
  const input = document.createElement('input');
  input.setAttribute('value', text);
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}

// Function to share group via different methods
function shareVia(method) {
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  const inviteCode = group.inviteCode;
  const message = `Join my expense group "${group.name}" on Expensiver! Use invite code: ${inviteCode}`;
  
  switch(method) {
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      break;
    case 'email':
      window.location.href = `mailto:?subject=Join my expense group on Expensiver&body=${encodeURIComponent(message)}`;
      break;
    case 'sms':
      window.location.href = `sms:?body=${encodeURIComponent(message)}`;
      break;
    default:
      // Just copy to clipboard
      copyToClipboard(message);
      showNotification('Share message copied to clipboard!');
  }
}

// Function to confirm group deletion
function confirmDeleteGroup() {
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Set up the confirm delete button
  const confirmBtn = document.getElementById('confirm-delete-btn');
  confirmBtn.onclick = () => deleteGroup(currentGroupId);
  
  // Show the confirmation modal
  showModal('delete-confirmation-modal');
}

// Function to actually delete a group
function deleteGroup(groupId) {
  const groupIndex = groups.findIndex(g => g.id === groupId);
  if (groupIndex === -1) return;
  
  // Remove group from array
  groups.splice(groupIndex, 1);
  
  // Save changes
  saveGroups();
  
  // Close modals
  closeModal('delete-confirmation-modal');
  
  // Show notification
  showNotification('Group deleted successfully!');
  
  // Go back to dashboard
  showSection('dashboard');
}

// Function to export group data
function exportGroupData() {
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Create a filtered copy of the group data
  const exportData = {
    name: group.name,
    description: group.description,
    currency: group.currency,
    category: group.category,
    members: group.members.map(m => ({ name: m.name })),
    expenses: group.expenses.map(e => ({
      description: e.description,
      amount: e.amount,
      category: e.category,
      date: e.date,
      notes: e.notes,
      paidBy: e.payers.map(p => {
        const member = group.members.find(m => m.id === p.id);
        return { name: member?.name || 'Unknown', amount: p.amount };
      }),
      splitBetween: e.splits.map(s => {
        const member = group.members.find(m => m.id === s.id);
        return { name: member?.name || 'Unknown', amount: s.amount };
      }),
      splitType: e.splitType
    }))
  };
  
  // Convert to JSON and create a download link
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `${group.name.replace(/\s+/g, '-')}-expenses.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  
  showNotification('Group data exported successfully!');
}

// Function to handle history tab with timeline view
function showHistory(viewType) {
  if (!currentGroupId) return;
  
  const group = groups.find(g => g.id === currentGroupId);
  if (!group) return;
  
  // Set active tab
  setActiveTab('history');
  
  const tabContent = document.getElementById('tab-content');
  
  // Check if there are any expenses or settlements
  const hasActivity = group.expenses.length > 0 || group.settlements.length > 0;
  
  if (!hasActivity) {
    tabContent.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-history"></i>
        <h3>No Activity Yet</h3>
        <p>Add expenses or record settlements to see your group history.</p>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 1rem;">
          <button class="primary-button" onclick="showModal('add-expense-modal')">
            <i class="fas fa-plus"></i> Add Expense
          </button>
          <button class="secondary-button" onclick="showModal('settle-up-modal')">
            <i class="fas fa-exchange-alt"></i> Record Settlement
          </button>
        </div>
      </div>
    `;
    return;
  }
  
  // Create a combined activity list (expenses + settlements)
  const activities = [
    ...group.expenses.map(expense => ({
      type: 'expense',
      id: expense.id,
      date: expense.date,
      data: expense
    })),
    ...group.settlements.map(settlement => ({
      type: 'settlement',
      id: settlement.id,
      date: settlement.date,
      data: settlement
    }))
  ];
  
  // Sort by date (newest first)
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Group by date
  const groupedActivities = {};
  
  activities.forEach(activity => {
    const date = activity.date;
    if (!groupedActivities[date]) {
      groupedActivities[date] = [];
    }
    groupedActivities[date].push(activity);
  });
  
  // Build content for timeline view
  let content = `
    <div class="history-header">
      <h3>Activity History</h3>
      <div class="history-view-options">
        <button class="view-option ${viewType === 'timeline' ? 'active' : ''}" onclick="showHistory('timeline')">
          <i class="fas fa-stream"></i> Timeline
        </button>
        <button class="view-option ${viewType === 'calendar' ? 'active' : ''}" onclick="showHistory('calendar')">
          <i class="fas fa-calendar-alt"></i> Calendar
        </button>
      </div>
    </div>
    
    <div class="history-content">
  `;
  
  if (viewType === 'timeline') {
    content += `<div class="history-timeline">`;
    
    // Add each date group
    Object.keys(groupedActivities).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
      content += `
        <div class="timeline-date">
          <span>${formatDate(date)}</span>
        </div>
        <div class="timeline-line"></div>
        <div class="timeline-group">
      `;
      
      // Add each activity for this date
      groupedActivities[date].forEach(activity => {
        if (activity.type === 'expense') {
          const expense = activity.data;
          const payer = group.members.find(m => m.id === expense.payers[0]?.id);
          const payerName = payer ? payer.name : 'Unknown';
          
          content += `
            <div class="timeline-expense" onclick="viewExpenseDetails('${expense.id}')">
              <div class="expense-icon category-${expense.category}">
                <i class="fas fa-${getCategoryIcon(expense.category)}"></i>
              </div>
              <div class="expense-details">
                <h4>${expense.description}</h4>
                <p><i class="fas fa-user"></i> ${payerName} paid ${group.currency}${parseFloat(expense.amount).toFixed(2)}</p>
              </div>
            </div>
          `;
        } else if (activity.type === 'settlement') {
          const settlement = activity.data;
          const fromMember = group.members.find(m => m.id === settlement.from);
          const toMember = group.members.find(m => m.id === settlement.to);
          const fromName = fromMember ? fromMember.name : 'Unknown';
          const toName = toMember ? toMember.name : 'Unknown';
          
          content += `
            <div class="timeline-expense">
              <div class="expense-icon">
                <i class="fas fa-exchange-alt"></i>
              </div>
              <div class="expense-details">
                <h4>Settlement</h4>
                <p>${fromName} paid ${group.currency}${parseFloat(settlement.amount).toFixed(2)} to ${toName}</p>
              </div>
            </div>
          `;
        }
      });
      
      content += `</div>`;
    });
    
    content += `</div>`;
  } else if (viewType === 'calendar') {
    // Calendar view (simplified for now)
    content += `
      <div class="history-calendar">
        <div class="calendar-header">
          <h4>Calendar View</h4>
          <div class="calendar-nav">
            <button class="icon-button"><i class="fas fa-chevron-left"></i></button>
            <h4>April 2024</h4>
            <button class="icon-button"><i class="fas fa-chevron-right"></i></button>
          </div>
        </div>
        <div class="empty-state">
          <p>Calendar view is coming soon...</p>
        </div>
      </div>
    `;
  }
  
  content += `</div>`;
  tabContent.innerHTML = content;
}

// Function to filter transactions in history modal
function filterTransactions() {
  const typeFilter = document.getElementById('transaction-type-filter').value;
  const dateFilter = document.getElementById('transaction-date-filter').value;
  
  const transactions = document.querySelectorAll('.transaction-item');
  
  transactions.forEach(transaction => {
    const type = transaction.querySelector('.transaction-icon').classList[1]; // add, payment, received
    const date = new Date(transaction.querySelector('.transaction-meta').textContent.split(' · ')[0]);
    const now = new Date();
    
    let showByType = typeFilter === 'all' || type === typeFilter;
    let showByDate = true;
    
    if (dateFilter === 'week') {
      const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      showByDate = date >= oneWeekAgo;
    } else if (dateFilter === 'month') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      showByDate = date >= oneMonthAgo;
    } else if (dateFilter === 'quarter') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      showByDate = date >= threeMonthsAgo;
    } else if (dateFilter === 'year') {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      showByDate = date >= oneYearAgo;
    }
    
    transaction.style.display = showByType && showByDate ? 'flex' : 'none';
  });
}

// Export transactions to CSV
function exportTransactions() {
  if (!currentUser.wallet.transactions || currentUser.wallet.transactions.length === 0) {
    showNotification('No transactions to export.', 'error');
    return;
  }
  
  // Create CSV content
  let csvContent = "Date,Type,Amount,Method,Notes\n";
  
  currentUser.wallet.transactions.forEach(transaction => {
    csvContent += `${formatDate(transaction.date)},`;
    csvContent += `${transaction.type},`;
    csvContent += `${transaction.amount},`;
    csvContent += `${transaction.method || ''},`;
    csvContent += `"${transaction.notes || ''}"\n`;
  });
  
  // Create and trigger download
  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "wallet-transactions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('Transactions exported successfully!');
}

// Debug function to inspect group state (for development)
function debugGroupState() {
  const group = groups.find(g => g.id === currentGroupId);
  return group ? JSON.stringify(group, null, 2) : 'No current group';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Additional setup
  document.getElementById('budget-period').addEventListener('change', toggleBudgetPeriod);
  
  // Handle avatar selection in edit profile
  const avatarOptions = document.querySelectorAll('.avatar-option');
  avatarOptions.forEach(option => {
    option.addEventListener('click', function() {
      document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      document.getElementById('selected-avatar').value = this.getAttribute('data-avatar');
    });
  });
});
