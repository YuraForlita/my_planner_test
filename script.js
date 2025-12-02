import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, setDoc, getDoc, getDocs, where, writeBatch, arrayUnion } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

window.onload = function () {
    setLogLevel('debug');

    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
        apiKey: "AIzaSyB4WVraBbIFYAnqa63xPgxgDRwKar99tdQ",
        authDomain: "planer-test-40ee1.firebaseapp.com",
        projectId: "planer-test-40ee1",
        storageBucket: "planer-test-40ee1.firebasestorage.app",
        messagingSenderId: "68109418592",
        appId: "1:68109418592:web:b072d11b1f80a97fd9c305",
        measurementId: "G-YJJNFTVN1Y"
    };

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("YOUR_")) {
        document.getElementById('loading-spinner').classList.add('hidden');
        document.getElementById('error-message').classList.remove('hidden');
        return;
    }

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    const getEl = (id) => document.getElementById(id);

    const mainContent = getEl('main-content'), taskInput = getEl('task-input'), addTaskButton = getEl('add-task-btn'),
          assignTaskOpenBtn = getEl('assign-task-open-btn'), userIdSpan = getEl('user-id-span'),
          loadingSpinner = getEl('loading-spinner'), authButtons = getEl('auth-buttons'),
          contentSection = getEl('content-section'), googleSignInButton = getEl('google-signin-btn'),
          signOutButton = getEl('signout-btn'), confirmModal = getEl('confirm-modal'),
          confirmModalMessage = getEl('confirm-modal-message'), confirmDeleteButton = confirmModal.querySelector('.confirm-btn'),
          cancelDeleteButton = confirmModal.querySelector('.cancel-btn'), notificationModal = getEl('notification-modal'),
          notificationTitle = getEl('notification-title'), notificationMessage = getEl('notification-message'),
          closeNotificationBtn = getEl('close-notification-btn'), viewEditModal = getEl('view-edit-modal'),
          editTaskInput = getEl('edit-task-input'), saveEditBtn = getEl('save-edit-btn'),
          cancelEditBtn = getEl('cancel-edit-btn'), activeTasksList = getEl('active-tasks-list'),
          deferredTasksList = getEl('deferred-tasks-list'), completedTasksList = getEl('completed-tasks-list'),
          deferredToggleBtn = getEl('deferred-toggle-btn'), completedToggleBtn = getEl('completed-toggle-btn'),
          settingsToggleBtn = getEl('settings-toggle-btn'), settingsContent = getEl('settings-content'),
          deferredDurationInput = getEl('deferred-duration'), staleDurationInput = getEl('stale-duration'),
          saveSettingsBtn = getEl('save-settings-btn'), settingsMessage = getEl('settings-message'),
          incomingTasksSection = getEl('incoming-tasks-section'), incomingTasksList = getEl('incoming-tasks-list'),
          friendsToggleBtn = getEl('friends-toggle-btn'), friendsContent = getEl('friends-content'),
          addFriendOpenBtn = getEl('add-friend-open-btn'), friendsList = getEl('friends-list'),
          addFriendModal = getEl('add-friend-modal'), friendNameInput = getEl('friend-name-input'),
          friendIdInput = getEl('friend-id-input'), saveFriendBtn = getEl('save-friend-btn'),
          cancelFriendBtn = getEl('cancel-friend-btn'), assignTaskModal = getEl('assign-task-modal'),
          friendSelect = getEl('friend-select'), assignTaskInput = getEl('assign-task-input'),
          sendTaskBtn = getEl('send-task-btn'), cancelAssignBtn = getEl('cancel-assign-btn'),
          chatsBtn = getEl('chats-btn'), chatNotificationBadge = getEl('chat-notification-badge'),
          chatSection = getEl('chat-section'), backToTasksBtn = getEl('back-to-tasks-btn'),
          chatFriendsList = getEl('chat-friends-list'), chatWindow = getEl('chat-window'),
          chatWindowPlaceholder = getEl('chat-window-placeholder'), chatHeader = getEl('chat-header'),
          chatMessages = getEl('chat-messages'), chatMessageInput = getEl('chat-message-input'),
          sendChatMessageBtn = getEl('send-chat-message-btn'), enableNotificationsBtn = getEl('enable-notifications-btn'),
          notificationsStatus = getEl('notifications-status'), imageViewerModal = getEl('image-viewer-modal'),
          fullImage = getEl('full-image'), closeImageViewerBtn = getEl('close-image-viewer-btn'),
          attachFileBtn = getEl('attach-file-btn'), imageUploadInput = getEl('image-upload-input'),
          uploadProgressContainer = getEl('upload-progress-container'), uploadProgressBar = getEl('upload-progress-bar'),
          reportBtn = getEl('report-btn'), reportSection = getEl('report-section'),
          backToTasksFromReportBtn = getEl('back-to-tasks-from-report-btn'), reportTableBody = getEl('report-table-body'),
          taskDetailsModal = getEl('task-details-modal'), taskDetailsContent = getEl('task-details-content'),
          closeTaskDetailsBtn = getEl('close-task-details-btn'),
          deleteFromReportBtn = getEl('delete-from-report-btn'),
          viewIncomingTaskModal = getEl('view-incoming-task-modal'),
          incomingTaskSender = getEl('incoming-task-sender'),
          incomingTaskContent = getEl('incoming-task-content'),
          incomingTaskAcceptBtn = getEl('incoming-task-accept-btn'),
          incomingTaskDeclineBtn = getEl('incoming-task-decline-btn'),
          incomingTaskCloseBtn = getEl('incoming-task-close-btn'),
          taskActionsModal = getEl('task-actions-modal'),
          actionDeferBtn = getEl('action-defer-btn'),
          actionActivateBtn = getEl('action-activate-btn'),
          actionProlongBtn = getEl('action-prolong-btn'),
          actionDeleteBtn = getEl('action-delete-btn'),
          cancelActionsBtn = getEl('cancel-actions-btn'),
          resourcesBtn = getEl('resources-btn'), resourcesSection = getEl('resources-section'),
          backToTasksFromResourcesBtn = getEl('back-to-tasks-from-resources-btn'),
          resourcesGrid = getEl('resources-grid'), addShelfBtn = getEl('add-shelf-btn'),
          addShelfModal = getEl('add-shelf-modal'), shelfNameInput = getEl('shelf-name-input'),
          saveShelfBtn = getEl('save-shelf-btn'), cancelShelfBtn = getEl('cancel-shelf-btn'),
          addResourceModal = getEl('add-resource-modal'), resourceTitleInput = getEl('resource-title-input'),
          resourceContentInput = getEl('resource-content-input'),
          saveResourceBtn = getEl('save-resource-btn'), cancelResourceBtn = getEl('cancel-resource-btn'),
          resourcesSearchInput = getEl('resources-search-input');

    const boardsBtn = getEl('boards-btn'), boardsSection = getEl('boards-section'),
          backToTasksFromBoardsBtn = getEl('back-to-tasks-from-boards-btn'),
          boardsGrid = getEl('boards-grid'), createBoardBtn = getEl('create-board-btn'),
          createBoardModal = getEl('create-board-modal'), boardNameInput = getEl('board-name-input'),
          saveBoardBtn = getEl('save-board-btn'), cancelBoardBtn = getEl('cancel-board-btn'),
          boardsListView = getEl('boards-list-view'), activeBoardView = getEl('active-board-view'),
          activeBoardTitle = getEl('active-board-title'), backToBoardsListBtn = getEl('back-to-boards-list-btn'),
          addBoardMemberBtn = getEl('add-board-member-btn'), addBoardMemberModal = getEl('add-board-member-modal'),
          boardFriendSelect = getEl('board-friend-select'), saveBoardMemberBtn = getEl('save-board-member-btn'),
          cancelBoardMemberBtn = getEl('cancel-board-member-btn'),
          boardTasksList = getEl('board-tasks-list'), addBoardTaskBtn = getEl('add-board-task-btn'),
          addBoardTaskModal = getEl('add-board-task-modal'), boardTaskTitle = getEl('board-task-title'),
          subtasksContainer = getEl('subtasks-container'), addSubtaskFieldBtn = getEl('add-subtask-field-btn'),
          saveBoardTaskBtn = getEl('save-board-task-btn'), cancelBoardTaskBtn = getEl('cancel-board-task-btn'),
          boardStickersArea = getEl('board-stickers-area'), addStickerBtn = getEl('add-sticker-btn'),
          addStickerModal = getEl('add-sticker-modal'), stickerTextInput = getEl('sticker-text-input'),
          saveStickerBtn = getEl('save-sticker-btn'), cancelStickerBtn = getEl('cancel-sticker-btn'),
          mobileTabTasks = getEl('mobile-tab-tasks'), mobileTabStickers = getEl('mobile-tab-stickers'),
          boardTasksColumn = getEl('board-tasks-column'), boardStickersColumn = getEl('board-stickers-column');

    let currentEditingTask = null;
    const editBoardTaskModal = getEl('editBoardTaskModal');
    const editBoardTaskTitle = getEl('editBoardTaskTitle');
    const editSubtasksContainer = getEl('editSubtasksContainer');
    const addEditSubtaskBtn = getEl('addEditSubtaskBtn');
    const cancelEditBoardTaskBtn = getEl('cancelEditBoardTaskBtn');
    const saveEditBoardTaskBtn = getEl('saveEditBoardTaskBtn');

    let currentEditingBoard = null;
    const editBoardModal = getEl('editBoardModal');
    const editBoardTitleInput = getEl('editBoardTitleInput');
    const cancelEditBoardBtn = getEl('cancelEditBoardBtn');
    const saveEditBoardBtn = getEl('saveEditBoardBtn');

    let userId = null, currentAction = null, deferredDurationHours = 24, staleDurationHours = 72,
        currentTaskToEdit = null, selectedFriendForChat = null, unsubscribeFromChat = null,
        friendsCache = {}, shownNotifications = new Set(),
        unsubscribeFromReport = null, currentReportTaskIdToDelete = null,
        currentIncomingTask = null, currentTaskForAction = null,
        unsubscribeFromResources = null, currentShelfIdForResource = null,
        currentShelvesData = [],
        unsubscribeFromBoards = null, unsubscribeFromBoardItems = null, currentBoardId = null,
        selectedStickerColor = 'bg-yellow-200', currentMobileTab = 'tasks';

    const signInWithGoogle = async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (error) { console.error("Sign-in error:", error); } };
    const signOutUser = async () => { try { await signOut(auth); } catch (error) { console.error("Sign-out error:", error); } };
    const showNotification = (title, message) => { notificationTitle.textContent = title; notificationMessage.textContent = message; notificationModal.classList.remove('hidden'); };
    const hideNotification = () => notificationModal.classList.add('hidden');
    const showPushNotification = (title, options) => { if (document.hidden && Notification.permission === 'granted') { new Notification(title, options); } };

    function debounce(fn, wait) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }; }

    const getDisplayNameFor = (uid) => {
        if (!uid) return 'Невідомий';
        if (uid === userId) return (auth.currentUser?.displayName || 'Ви');
        if (friendsCache[uid] && friendsCache[uid].name) return friendsCache[uid].name;
        return uid.substring(0,6) + '...';
    };

    const getInitials = (uid) => {
        const name = getDisplayNameFor(uid);
        const parts = name.split(/\s+/).filter(Boolean);
        if (parts.length === 0) return name.slice(0,2).toUpperCase();
        if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    const colorForUid = (uid) => {
        const colors = ['#6366f1','#ef4444','#f97316','#059669','#0ea5e9','#8b5cf6','#db2777','#eab308'];
        let hash = 0;
        for (let i=0;i<uid.length;i++) hash = (hash<<5)-hash + uid.charCodeAt(i);
        return colors[Math.abs(hash) % colors.length];
    };

    const fmtTime = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts));
        return d.toLocaleString();
    };

    const loadSettings = async () => {
        if (!userId) return;
        try {
            const settingsRef = doc(db, `artifacts/${appId}/users/${userId}/settings/app_settings`);
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                const settings = docSnap.data();
                deferredDurationHours = settings.deferredDurationHours || 24;
                staleDurationHours = settings.staleDurationHours || 72;
                if (settings.expandedSections) {
                    Object.entries(settings.expandedSections).forEach(([key, isExpanded]) => {
                        const list = getEl(`${key}-tasks-list`) || getEl(`${key}-content`);
                        const btn = getEl(`${key}-toggle-btn`);
                        if (list && btn) { list.classList.toggle('hidden', !isExpanded); btn.textContent = isExpanded ? 'Згорнути' : 'Розгорнути'; }
                    });
                }
            }
            deferredDurationInput.value = deferredDurationHours;
            staleDurationInput.value = staleDurationHours;
        } catch (e) { console.error("Error loading settings:", e); }
    };

    const subscribeToTasks = () => {
        if (!db || !userId) return;
        const q = query(collection(db, `artifacts/${appId}/users/${userId}/tasks`), orderBy("createdAt", "desc"));
        onSnapshot(q, (querySnapshot) => {
            const tasks = { active: [], deferred: [], completed: [] };
            querySnapshot.forEach(async (docSnap) => {
                const task = { id: docSnap.id, ...docSnap.data(), ref: docSnap.ref };
                if (task.status === 'deferred' && task.deferredAt) {
                    if (Date.now() - task.deferredAt.toMillis() >= deferredDurationHours * 3600000) {
                        await updateTaskStatus(task.id, 'active', task.originalSharedTaskId);
                        showPushNotification('Завдання повернуто до активних', { body: `Завдання: "${task.text}"` });
                        return;
                    }
                }
                if (task.status === 'active' && task.lastUpdatedAt) {
                   if (Date.now() - task.lastUpdatedAt.toMillis() >= staleDurationHours * 3600000 && !task.isStale) {
                        await updateDoc(task.ref, { isStale: true });
                        task.isStale = true;
                        showPushNotification('Завдання стало застарілим', { body: `Зверніть увагу на завдання: "${task.text}"` });
                    }
                }
                (tasks[task.status] || tasks.active).push(task);
            });
            renderTasks(tasks.active, activeTasksList, 'active');
            renderTasks(tasks.deferred, deferredTasksList, 'deferred');
            renderTasks(tasks.completed, completedTasksList, 'completed');
        }, error => console.error("Error in tasks subscription: ", error));
    };

    const renderTasks = (tasks, listElement, status) => {
        listElement.innerHTML = '';
        if (!tasks || tasks.length === 0) {
            const messages = { active: 'Немає активних завдань.', deferred: 'Немає завдань в роботі.', completed: 'Немає виконаних завдань.' };
            listElement.innerHTML = `<p class="text-gray-500 text-center italic">${messages[status]}</p>`;
            return;
        }
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `p-4 rounded-xl shadow-md flex items-start justify-between ${task.isStale ? 'bg-red-100' : 'bg-white'} space-x-2`;
            let buttonsHTML = status === 'completed' 
                ? `<button class="active-btn px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 btn-frosty">Активувати</button>`
                : `<button class="complete-btn px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 btn-frosty">Виконано</button>
                   <button class="more-options-btn p-2 rounded-full hover:bg-gray-200">...</button>`;
            
            taskItem.innerHTML = `
                <div class="flex-grow min-w-0">
                    <p class="text-gray-800 cursor-pointer text-truncate-2 break-words">${task.text}</p>
                </div>
                <div class="flex-shrink-0 flex items-center space-x-2">${buttonsHTML}</div>`;
            
            if (status !== 'completed') {
                const moreBtn = taskItem.querySelector('.more-options-btn');
                if (moreBtn) moreBtn.addEventListener('click', (e) => { e.stopPropagation(); showTaskActionsModal(task); });
            }
            taskItem.querySelector('p').addEventListener('click', () => showViewEditModal(task));
            if (taskItem.querySelector('.complete-btn')) taskItem.querySelector('.complete-btn').addEventListener('click', () => updateTaskStatus(task.id, 'completed', task.originalSharedTaskId));
            if (taskItem.querySelector('.active-btn')) taskItem.querySelector('.active-btn').addEventListener('click', () => updateTaskStatus(task.id, 'active', task.originalSharedTaskId));
            listElement.appendChild(taskItem);
        });
    };

    const addTask = async () => {
        const taskText = taskInput.value.trim();
        if (taskText === '' || !userId) return;
        try {
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/tasks`), { text: taskText, status: 'active', createdAt: serverTimestamp(), lastUpdatedAt: serverTimestamp(), isStale: false });
            taskInput.value = '';
        } catch (e) { console.error("Error adding task: ", e); }
    };

    const updateTaskStatus = async (id, newStatus, originalSharedTaskId = null) => {
        if (!userId) return;
        try {
            let updateData = { status: newStatus, lastUpdatedAt: serverTimestamp(), isStale: false };
            if (newStatus === 'deferred') updateData.deferredAt = serverTimestamp();
            await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, id), updateData);

            if (originalSharedTaskId) {
                const publicTaskRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_tasks', originalSharedTaskId);
                let publicStatus = (newStatus === 'active' || newStatus === 'deferred') ? 'accepted' : newStatus;
                await updateDoc(publicTaskRef, { status: publicStatus });
            }
        } catch (e) { console.error("Error updating task status: ", e); }
    };

    const prolongTask = async (id) => { if (!userId) return; try { await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, id), { lastUpdatedAt: serverTimestamp(), isStale: false }); } catch (e) { console.error("Error prolonging task:", e); } };

    const saveSettings = async () => { 
        if (!userId) return; 
        const newDeferred = parseFloat(deferredDurationInput.value); 
        const newStale = parseFloat(staleDurationInput.value); 
        if (isNaN(newDeferred) || newDeferred < 0 || isNaN(newStale) || newStale < 0) { settingsMessage.textContent = "Будь ласка, введіть дійсні числа."; settingsMessage.className = 'text-sm text-center text-red-600'; return; } 
        try { 
            await setDoc(doc(db, `artifacts/${appId}/users/${userId}/settings/app_settings`), { deferredDurationHours: newDeferred, staleDurationHours: newStale }, { merge: true }); 
            deferredDurationHours = newDeferred; staleDurationHours = newStale; 
            settingsMessage.textContent = "Налаштування збережено."; settingsMessage.className = 'text-sm text-center text-green-600 visible'; 
            setTimeout(() => settingsMessage.classList.remove('visible'), 3000); 
        } catch (e) { console.error("Error saving settings:", e); } 
    };

    const saveExpansionState = async () => { 
        if (!userId) return; 
        const sections = { deferred: !deferredTasksList.classList.contains('hidden'), completed: !completedTasksList.classList.contains('hidden'), settings: !settingsContent.classList.contains('hidden'), friends: !friendsContent.classList.contains('hidden') }; 
        try { const settingsRef = doc(db, `artifacts/${appId}/users/${userId}/settings/app_settings`); await setDoc(settingsRef, { expandedSections: sections }, { merge: true }); } catch (e) { console.error("Error saving expansion state:", e); } 
    };

    const showConfirmModal = (action, message, buttonText) => { currentAction = action; confirmModalMessage.textContent = message; confirmDeleteButton.textContent = buttonText; confirmModal.classList.remove('hidden'); };
    const hideConfirmModal = () => { confirmModal.classList.add('hidden'); currentAction = null; };

    const deleteTask = async (task) => { 
        if (!userId || !task || !task.id) return; 
        try { 
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id)); 
            if (task.originalSharedTaskId) { 
                const publicTaskRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_tasks', task.originalSharedTaskId); 
                await updateDoc(publicTaskRef, { status: 'declined' }); 
            } 
        } catch (e) { console.error("Error processing task deletion: ", e); showNotification('Помилка', 'Не вдалося повністю видалити завдання. Спробуйте ще раз.'); } 
    };

    const deleteChatMessage = async (msg) => { 
        if (!userId || !msg.id || msg.senderId !== userId) return; 
        try { 
            const publicDataRef = doc(db, 'artifacts', appId, 'public', 'data'); 
            await deleteDoc(doc(collection(publicDataRef, 'chat_messages'), msg.id)); 
            if (msg.type === 'image' && msg.imageUrl) { 
                const imageRef = ref(storage, msg.imageUrl); 
                await deleteObject(imageRef); 
            } 
        } catch (e) { console.error("Error deleting chat message:", e); } 
    };

    const showViewEditModal = (task) => { currentTaskToEdit = task; editTaskInput.value = task.text; viewEditModal.classList.remove('hidden'); };
    const hideViewEditModal = () => { viewEditModal.classList.add('hidden'); currentTaskToEdit = null; };
    const saveEditedTask = async () => { 
        if (!userId || !currentTaskToEdit) return; 
        const newText = editTaskInput.value.trim(); 
        if (newText === '') { showNotification('Помилка', 'Текст завдання не може бути порожнім.'); return; } 
        try { await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/tasks`, currentTaskToEdit.id), { text: newText, lastUpdatedAt: serverTimestamp() }); hideViewEditModal(); } catch (e) { console.error("Error updating task:", e); } 
    };

    const showAddFriendModal = () => { friendNameInput.value = ''; friendIdInput.value = ''; addFriendModal.classList.remove('hidden'); };
    const hideAddFriendModal = () => { addFriendModal.classList.add('hidden'); };
    const saveFriend = async () => { 
        const name = friendNameInput.value.trim(); 
        const friendId = friendIdInput.value.trim(); 
        if (name === '' || friendId === '' || friendId === userId) return; 
        try { await setDoc(doc(db, `artifacts/${appId}/users/${userId}/friends`, friendId), { name, userId: friendId }); hideAddFriendModal(); } catch (e) { console.error("Error adding friend:", e); } 
    };
    const deleteFriend = async (friendId) => { 
        if (!userId || !friendId) return; 
        try { await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/friends`, friendId)); } catch (e) { console.error("Error deleting friend:", e); showNotification('Помилка', 'Не вдалося видалити друга.'); } 
    };

    const subscribeToFriends = () => { 
        if (!userId) return; 
        try { onSnapshot(collection(db, `artifacts/${appId}/users/${userId}/friends`), (snapshot) => { friendsCache = {}; snapshot.docs.forEach(d => friendsCache[d.id] = d.data()); renderFriends(Object.values(friendsCache)); renderChatFriends(Object.values(friendsCache)); }, error => console.error("Error in friends subscription:", error)); } catch (e) { console.error("Error subscribing to friends:", e); } 
    };

    const renderFriends = (friends) => { 
        friendsList.innerHTML = ''; friendSelect.innerHTML = '<option value="">Виберіть друга</option>'; 
        if (friends.length === 0) { friendsList.innerHTML = `<p class="text-gray-500 text-center italic">Немає друзів.</p>`; return; } 
        friends.forEach(friend => { 
            const friendItem = document.createElement('div'); friendItem.className = 'p-3 rounded-lg bg-white shadow-md flex justify-between items-center'; 
            friendItem.innerHTML = `<div><p class="font-semibold text-gray-800">${friend.name}</p><p class="text-sm text-gray-500 break-all">${friend.userId}</p></div><button class="delete-friend-btn p-2 rounded-full hover:bg-red-100 text-red-500"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>`; 
            friendItem.querySelector('.delete-friend-btn').addEventListener('click', () => { showConfirmModal(() => deleteFriend(friend.userId), `Ви впевнені, що хочете видалити ${friend.name} зі списку друзів?`, "Так, видалити"); }); 
            friendsList.appendChild(friendItem); friendSelect.innerHTML += `<option value="${friend.userId}">${friend.name}</option>`; 
        }); 
    };

    const renderChatFriends = (friends) => { chatFriendsList.innerHTML = friends.length === 0 ? `<p class="text-gray-500 text-center italic p-4">Немає друзів для чату.</p>` : ''; friends.forEach(friend => { const friendItem = document.createElement('div'); friendItem.className = 'p-3 rounded-lg hover:bg-indigo-100 cursor-pointer flex items-center justify-between'; friendItem.innerHTML = `<div class="font-semibold text-gray-800 flex-grow">${friend.name}</div><span id="unread-count-${friend.userId}" class="px-2 py-1 bg-red-600 text-white text-xs rounded-full hidden"></span>`; friendItem.addEventListener('click', () => selectFriendForChat(friend)); chatFriendsList.appendChild(friendItem); }); };

    const showAssignTaskModal = () => { assignTaskInput.value = ''; friendSelect.value = ''; assignTaskModal.classList.remove('hidden'); };
    const hideAssignTaskModal = () => { assignTaskModal.classList.add('hidden'); };
    const sendAssignedTask = async () => { 
        const recipientId = friendSelect.value; const taskText = assignTaskInput.value.trim(); 
        if (recipientId === '' || taskText === '') return; 
        try { 
            const sharedTasksCollection = collection(db, 'artifacts', appId, 'public', 'data', 'shared_tasks'); 
            await addDoc(sharedTasksCollection, { text: taskText, senderId: userId, senderName: auth.currentUser.displayName || 'Анонім', recipientId, createdAt: serverTimestamp(), status: 'pending' }); 
            const selectedFriend = { userId: recipientId, name: friendSelect.options[friendSelect.selectedIndex].text }; 
            await sendChatMessage({ text: `Я призначив вам завдання: "${taskText}"`, recipient: selectedFriend, isTask: true }); 
            hideAssignTaskModal(); 
        } catch (e) { console.error("Error sending assigned task:", e); } 
    };

    const subscribeToIncomingTasks = () => { 
        if (!userId) return; 
        const sharedTasksCollection = collection(db, 'artifacts', appId, 'public', 'data', 'shared_tasks'); 
        const q = query(sharedTasksCollection, where("recipientId", "==", userId), where("status", "==", "pending")); 
        onSnapshot(q, (snapshot) => { const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() })); tasks.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)); renderIncomingTasks(tasks); }, error => console.error("Error in incoming tasks subscription:", error)); 
    };

    const renderIncomingTasks = (tasks) => { 
        incomingTasksList.innerHTML = ''; 
        if (tasks.length === 0) { incomingTasksSection.style.display = 'none'; return; } 
        incomingTasksSection.style.display = 'block'; 
        tasks.forEach(task => { 
            const taskItem = document.createElement('div'); taskItem.className = 'p-4 rounded-xl shadow-md bg-white flex items-center justify-between space-x-2'; taskItem.innerHTML = `<div class="flex-grow cursor-pointer min-w-0"><p class="text-sm text-gray-500">Від: <span class="font-semibold">${task.senderName}</span></p><p class="text-gray-800 break-words">${task.text}</p></div><div class="flex-shrink-0"><button class="view-incoming-task-btn px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold btn-frosty">Переглянути</button></div>`; taskItem.querySelector('.view-incoming-task-btn').addEventListener('click', () => showViewIncomingTaskModal(task)); taskItem.querySelector('.flex-grow').addEventListener('click', () => showViewIncomingTaskModal(task)); incomingTasksList.appendChild(taskItem); }); 
    };

    const acceptIncomingTask = async (task) => { 
        if (!userId) return; 
        try { 
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/tasks`), { text: task.text, status: 'active', createdAt: serverTimestamp(), lastUpdatedAt: serverTimestamp(), isStale: false, assignedBy: task.senderName, originalSharedTaskId: task.id }); 
            await updateSharedTaskStatus(task.id, 'accepted'); 
        } catch (e) { console.error("Error accepting task:", e); } 
    };

    const updateSharedTaskStatus = async (taskId, status) => { try { const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_tasks', taskId); await updateDoc(taskRef, { status }); } catch (e) { console.error(`Error updating shared task to ${status}:`, e); } };

    const openChatView = () => { mainContent.classList.add('hidden'); chatSection.classList.remove('hidden'); };
    const closeChatView = () => { chatSection.classList.add('hidden'); mainContent.classList.remove('hidden'); if (unsubscribeFromChat) unsubscribeFromChat(); unsubscribeFromChat = null; selectedFriendForChat = null; chatWindow.classList.add('hidden'); chatWindowPlaceholder.classList.remove('hidden'); };

    const selectFriendForChat = async (friend) => {
        selectedFriendForChat = friend;
        chatWindowPlaceholder.classList.add('hidden');
        chatWindow.classList.remove('hidden');
        chatHeader.textContent = `Чат з ${friend.name}`;
        chatMessages.innerHTML = '';
        if (unsubscribeFromChat) unsubscribeFromChat();
        const participants = [userId, friend.userId].sort();
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'chat_messages'), where("participants", "==", participants), orderBy("timestamp"));
        unsubscribeFromChat = onSnapshot(q, (snapshot) => {
            chatMessages.innerHTML = '';
            snapshot.docs.forEach(d => renderChatMessage({ id: d.id, ...d.data() }));
            setTimeout(() => { chatMessages.scrollTop = chatMessages.scrollHeight; }, 0);
        }, error => console.error("Chat subscription error:", error));
        await markMessagesAsRead(friend.userId);
    };

    const markMessagesAsRead = async (friendId) => {
        if (!userId || !friendId) return;
        const participants = [userId, friendId].sort();
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'chat_messages'), where("participants", "==", participants));
        try {
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.docs.forEach(docSnapshot => {
                const message = docSnapshot.data();
                if (message.readBy && !message.readBy.includes(userId)) {
                    batch.update(docSnapshot.ref, { readBy: arrayUnion(userId) });
                }
            });
            await batch.commit();
        } catch (e) { console.error("Error marking messages as read:", e); }
    };

    const subscribeToUnreadCounts = () => {
        if (!userId) return;
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'chat_messages'), where("participants", "array-contains", userId));
        onSnapshot(q, (snapshot) => {
            const unreadCounts = {}, unreadSenders = new Set();
            snapshot.docs.forEach(d => {
                const message = { id: d.id, ...d.data() };
                if (message.readBy && !message.readBy.includes(userId)) {
                    const friendId = message.participants.find(id => id !== userId);
                    if (friendId) {
                        unreadCounts[friendId] = (unreadCounts[friendId] || 0) + 1;
                        unreadSenders.add(friendId);
                        if (!shownNotifications.has(message.id)) {
                            const friendName = friendsCache[friendId]?.name || 'Друг';
                            showPushNotification(`Нове повідомлення від ${friendName}`, { body: message.text || '[Зображення]' });
                            shownNotifications.add(message.id);
                        }
                    }
                }
            });
            updateUnreadBadges(unreadCounts, unreadSenders.size);
        }, error => console.error("Unread counts subscription error:", error));
    };

    const updateUnreadBadges = (counts, totalSenders) => {
        chatNotificationBadge.textContent = totalSenders;
        chatNotificationBadge.classList.toggle('hidden', totalSenders === 0);
        Object.values(friendsCache).forEach(friend => {
            const badge = document.getElementById(`unread-count-${friend.userId}`);
            if (badge) {
                const count = counts[friend.userId];
                badge.textContent = count;
                badge.classList.toggle('hidden', !count);
            }
        });
    };

    const renderChatMessage = (message) => {
        const msgDiv = document.createElement('div');
        const isSentByMe = message.senderId === userId;
        msgDiv.className = `flex ${isSentByMe ? 'justify-end' : 'justify-start'}`;
        const bubble = document.createElement('div');
        bubble.className = `message-bubble p-3 rounded-lg max-w-xs md:max-w-md break-words relative group ${isSentByMe ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`;
        if (message.isTask) {
            bubble.className = 'message-bubble p-3 rounded-lg max-w-xs md:max-w-md break-words relative bg-yellow-200 text-yellow-800 border border-yellow-300 text-sm italic mx-auto';
            msgDiv.className = 'flex justify-center';
            bubble.textContent = message.text;
        } else if (message.type === 'image' && message.imageUrl) {
            const img = document.createElement('img');
            img.src = message.imageUrl;
            img.className = "max-w-[200px] rounded-lg cursor-pointer max-h-48";
            img.addEventListener('click', () => showImageViewer(message.imageUrl));
            bubble.appendChild(img);
        } else {
            bubble.textContent = message.text;
        }
        if (isSentByMe && !message.isTask) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-msg-btn absolute top-1/2 -left-8 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-gray-300 hover:bg-red-500 text-white';
            deleteBtn.innerHTML = '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';
            deleteBtn.addEventListener('click', () => showConfirmModal(() => deleteChatMessage(message), "Видалити це повідомлення?", "Видалити"));
            bubble.appendChild(deleteBtn);
        }
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
    };

    const showImageViewer = (url) => { fullImage.src = url; imageViewerModal.classList.remove('hidden'); };

    const sendChatMessage = async (options) => {
        const { text, recipient, isTask = false, imageUrl = null } = options;
        const messageText = text ? text.trim() : '';
        if (messageText === '' && !imageUrl) return;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chat_messages'), { participants: [userId, recipient.userId].sort(), text: messageText, senderId: userId, timestamp: serverTimestamp(), isTask, readBy: [userId], type: imageUrl ? 'image' : 'text', imageUrl });
            if (!isTask) chatMessageInput.value = '';
        } catch (e) { console.error("Error sending chat message: ", e); }
    };

    const uploadImageAndSendMessage = (file) => {
        if (!file || !selectedFriendForChat) return;
        const participants = [userId, selectedFriendForChat.userId].sort();
        const storageRef = ref(storage, `chats/${participants.join('_')}/${Date.now()}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadProgressContainer.classList.remove('hidden');
        uploadTask.on('state_changed', (snapshot) => { uploadProgressBar.style.width = `${(snapshot.bytesTransferred / snapshot.totalBytes) * 100}%`; }, (error) => { console.error("Upload error:", error); uploadProgressContainer.classList.add('hidden'); }, () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => { sendChatMessage({ recipient: selectedFriendForChat, imageUrl: downloadURL }); uploadProgressContainer.classList.add('hidden'); });
        });
    };

    const checkNotificationStatus = () => { if (!('Notification' in window)) { notificationsStatus.textContent = "Браузер не підтримує сповіщення."; enableNotificationsBtn.disabled = true; return; } const permission = Notification.permission; notificationsStatus.textContent = permission === 'granted' ? "Сповіщення увімкнено." : permission === 'denied' ? "Сповіщення заблоковано." : "Надайте дозвіл."; enableNotificationsBtn.disabled = permission !== 'default'; };
    const requestNotificationPermission = async () => { const permission = await Notification.requestPermission(); if (permission === 'granted') { new Notification("Дякуємо!", { body: "Тепер ви будете отримувати сповіщення." }); } checkNotificationStatus(); };

    const openReportView = () => { mainContent.classList.add('hidden'); reportSection.classList.remove('hidden'); subscribeToReport(); };
    const closeReportView = () => { reportSection.classList.add('hidden'); mainContent.classList.remove('hidden'); if (unsubscribeFromReport) unsubscribeFromReport(); unsubscribeFromReport = null; };
    const subscribeToReport = () => { if (!userId) return; if (unsubscribeFromReport) unsubscribeFromReport(); const sharedTasksCollection = collection(db, 'artifacts', appId, 'public', 'data', 'shared_tasks'); const q = query(sharedTasksCollection, where("senderId", "==", userId)); unsubscribeFromReport = onSnapshot(q, (snapshot) => { const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() })); tasks.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)); renderReport(tasks); }, error => console.error("Error in report subscription:", error)); };
    const renderReport = (tasks) => {
        reportTableBody.innerHTML = '';
        if (Object.keys(friendsCache).length === 0 && tasks.length > 0) { setTimeout(() => renderReport(tasks), 100); return; }
        const tasksByRecipient = {};
        tasks.forEach(task => { if (!tasksByRecipient[task.recipientId]) tasksByRecipient[task.recipientId] = []; tasksByRecipient[task.recipientId].push(task); });
        if (Object.keys(tasksByRecipient).length === 0) { reportTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 italic py-8">Ви ще не призначили жодного завдання.</td></tr>`; return; }
        for (const recipientId in tasksByRecipient) {
            const userTasks = tasksByRecipient[recipientId];
            const friendName = friendsCache[recipientId]?.name || `Невідомий (${recipientId.substring(0,5)}...)`;
            const row = document.createElement('tr');
            const statuses = ['pending', 'accepted', 'completed', 'declined'];
            let cellsHTML = statuses.map(status => {
                const tasksInStatus = userTasks.filter(t => t.status === status);
                const cardsHTML = tasksInStatus.map(task => `<div class="report-task-card p-2 mb-2 bg-white rounded-md shadow-sm border" data-task-text="${escape(task.text)}" data-task-id="${task.id}"><p class="text-sm break-words">${task.text}</p></div>`).join('');
                return `<td class="align-top">${cardsHTML || ''}</td>`;
            }).join('');
            row.innerHTML = `<td>${friendName}</td>${cellsHTML}`;
            reportTableBody.appendChild(row);
        }
    };

    const showTaskDetailsModal = (taskText, taskId) => { taskDetailsContent.textContent = unescape(taskText); currentReportTaskIdToDelete = taskId; taskDetailsModal.classList.remove('hidden'); };
    const hideTaskDetailsModal = () => { taskDetailsModal.classList.add('hidden'); currentReportTaskIdToDelete = null; };
    const deleteSharedTaskFromReport = async () => { if (!currentReportTaskIdToDelete) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shared_tasks', currentReportTaskIdToDelete)); hideTaskDetailsModal(); } catch (e) { console.error("Error deleting task from report: ", e); } };

    const showViewIncomingTaskModal = (task) => { currentIncomingTask = task; incomingTaskSender.textContent = task.senderName; incomingTaskContent.textContent = task.text; viewIncomingTaskModal.classList.remove('hidden'); };
    const hideViewIncomingTaskModal = () => { viewIncomingTaskModal.classList.add('hidden'); currentIncomingTask = null; };
    const showTaskActionsModal = (task) => { currentTaskForAction = task; actionDeferBtn.classList.toggle('hidden', task.status === 'deferred'); actionActivateBtn.classList.toggle('hidden', task.status !== 'deferred'); actionProlongBtn.classList.toggle('hidden', !task.isStale); taskActionsModal.classList.remove('hidden'); };
    const hideTaskActionsModal = () => { taskActionsModal.classList.add('hidden'); currentTaskForAction = null; };

    const openResourcesView = () => { mainContent.classList.add('hidden'); resourcesSection.classList.remove('hidden'); subscribeToResources(); };
    const closeResourcesView = () => { resourcesSection.classList.add('hidden'); mainContent.classList.remove('hidden'); if (unsubscribeFromResources) unsubscribeFromResources(); unsubscribeFromResources = null; };

    const subscribeToResources = () => { if (!userId) return; const q = query(collection(db, `artifacts/${appId}/users/${userId}/resources`), orderBy("createdAt", "desc")); unsubscribeFromResources = onSnapshot(q, (snapshot) => { currentShelvesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); filterAndRenderResources(); }, error => console.error("Error in resources subscription:", error)); };

    const getFaviconUrl = (url) => { try { const domain = new URL(url).hostname; return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`; } catch (e) { return 'https://www.google.com/s2/favicons?domain=google.com'; } };

    const filterAndRenderResources = () => {
        const searchTerm = resourcesSearchInput.value.toLowerCase();
        const filteredShelves = currentShelvesData.map(shelf => {
            const items = (shelf.items || []).filter(item => { return (item.type === 'link') && (item.title.toLowerCase().includes(searchTerm) || item.url.toLowerCase().includes(searchTerm)); });
            return { ...shelf, items };
        }).filter(shelf => shelf.items.length > 0 || searchTerm === '');
        renderResources(filteredShelves);
    };

    const renderResources = (shelves) => {
        resourcesGrid.innerHTML = '';
        if (shelves.length === 0) {
            const emptyMessage = resourcesSearchInput.value ? "Нічого не знайдено за вашим запитом." : `<div class="col-span-full text-center py-12 text-gray-500"><div class="text-4xl mb-2">📚</div><p>У вас поки немає полиць з ресурсами.</p><p class="text-sm">Створіть першу, натиснувши "Нова Полиця"!</p></div>`;
            resourcesGrid.innerHTML = emptyMessage;
            return;
        }
        shelves.forEach(shelf => {
            const shelfDiv = document.createElement('div');
            shelfDiv.className = 'shelf-card rounded-xl p-4 flex flex-col h-full';
            const itemsHTML = (shelf.items || []).map(item => {
                if(item.type !== 'link') return '';
                const faviconUrl = getFaviconUrl(item.url);
                return `<div class="resource-item flex items-center justify-between p-2 rounded mb-1 group relative cursor-pointer" onclick="window.open('${item.url}', '_blank')"><div class="flex items-center space-x-3 overflow-hidden w-full"><img src="${faviconUrl}" alt="icon" class="resource-favicon flex-shrink-0" onerror="this.src='https://www.google.com/s2/favicons?domain=google.com'"><span class="text-gray-800 font-medium truncate text-sm">${item.title}</span></div><div class="flex space-x-1 absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded shadow-sm backdrop-blur-sm" onclick="event.stopPropagation()"><button class="copy-link-btn text-gray-500 hover:text-indigo-600 p-1.5" data-url="${item.url}" title="Копіювати"><i class="fas fa-copy"></i></button><button class="delete-resource-btn text-gray-500 hover:text-red-600 p-1.5" data-shelf-id="${shelf.id}" data-item-id="${item.id}" title="Видалити"><i class="fas fa-times"></i></button></div></div>`;
            }).join('');
            shelfDiv.innerHTML = `<div class="flex justify-between items-center mb-4 border-b pb-2 border-blue-200"><h3 class="font-bold text-lg text-gray-800 truncate" title="${shelf.title}">${shelf.title}</h3><button class="delete-shelf-btn text-gray-400 hover:text-red-500 transition-colors" data-id="${shelf.id}"><i class="fas fa-trash-alt"></i></button></div><div class="flex-grow overflow-y-auto max-h-64 mb-4 space-y-1 pr-1 custom-scrollbar">${itemsHTML || '<p class="text-sm text-gray-400 italic text-center mt-4">Порожньо</p>'}</div><button class="add-item-btn w-full py-2 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-500 transition-all font-medium text-sm" data-id="${shelf.id}">+ Додати посилання</button>`;
            shelfDiv.querySelector('.delete-shelf-btn').addEventListener('click', () => showConfirmModal(() => deleteShelf(shelf.id), `Видалити полицю "${shelf.title}" та всі її ресурси?`, "Видалити"));
            shelfDiv.querySelector('.add-item-btn').addEventListener('click', () => openAddResourceModal(shelf.id));
            shelfDiv.querySelectorAll('.delete-resource-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const itemId = e.currentTarget.dataset.itemId;
                    const originalShelf = currentShelvesData.find(s => s.id === shelf.id);
                    if(originalShelf) deleteResource(shelf.id, itemId, originalShelf.items);
                });
            });
            shelfDiv.querySelectorAll('.copy-link-btn').forEach(btn => {
                btn.addEventListener('click', (e) => { navigator.clipboard.writeText(e.currentTarget.dataset.url); showNotification("Скопійовано!", "Посилання скопійовано в буфер обміну."); });
            });
            resourcesGrid.appendChild(shelfDiv);
        });
    };

    const addShelf = async () => { const title = shelfNameInput.value.trim(); if (!title || !userId) return; try { await addDoc(collection(db, `artifacts/${appId}/users/${userId}/resources`), { title: title, createdAt: serverTimestamp(), items: [] }); addShelfModal.classList.add('hidden'); shelfNameInput.value = ''; } catch (e) { console.error("Error adding shelf: ", e); } };
    const deleteShelf = async (shelfId) => { if (!userId || !shelfId) return; try { await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/resources`, shelfId)); } catch (e) { console.error("Error deleting shelf: ", e); } };
    const openAddResourceModal = (shelfId) => { currentShelfIdForResource = shelfId; resourceTitleInput.value = ''; resourceContentInput.value = ''; addResourceModal.classList.remove('hidden'); };
    const addResource = async () => {
        if (!userId || !currentShelfIdForResource) return;
        const title = resourceTitleInput.value.trim();
        let content = resourceContentInput.value.trim();
        if (!title || !content) { showNotification("Помилка", "Всі поля повинні бути заповнені"); return; }
        if (!content.startsWith('http')) { content = 'https://' + content; }
        const newItem = { id: Date.now().toString() + Math.random().toString(36).substr(2, 5), title: title, type: 'link', url: content };
        try { const shelfRef = doc(db, `artifacts/${appId}/users/${userId}/resources`, currentShelfIdForResource); await updateDoc(shelfRef, { items: arrayUnion(newItem) }); addResourceModal.classList.add('hidden'); } catch (e) { console.error("Error adding resource: ", e); }
    };
    const deleteResource = async (shelfId, itemId, currentItems) => { if (!userId) return; try { const updatedItems = currentItems.filter(item => item.id !== itemId); const shelfRef = doc(db, `artifacts/${appId}/users/${userId}/resources`, shelfId); await updateDoc(shelfRef, { items: updatedItems }); } catch (e) { console.error("Error deleting resource: ", e); } };

    const switchMobileTab = (tab) => {
        currentMobileTab = tab;
        if (tab === 'tasks') {
            mobileTabTasks.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
            mobileTabTasks.classList.remove('text-gray-500');
            mobileTabStickers.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
            mobileTabStickers.classList.add('text-gray-500');
            boardTasksColumn.classList.remove('hidden');
            boardStickersColumn.classList.add('hidden');
            boardTasksColumn.classList.add('md:flex');
            boardStickersColumn.classList.add('md:block');
        } else {
            mobileTabStickers.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
            mobileTabStickers.classList.remove('text-gray-500');
            mobileTabTasks.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
            mobileTabTasks.classList.add('text-gray-500');
            boardStickersColumn.classList.remove('hidden');
            boardTasksColumn.classList.add('hidden');
            boardStickersColumn.classList.add('md:block');
            boardTasksColumn.classList.add('md:flex');
        }
    };
    let editingBoardTask = null;
    let editingBoard = null;

    function openEditBoardTask(item) {
        editingBoardTask = item;

        getEl("editBoardTaskTitle").value = item.text;

        const container = getEl("editSubtasksContainer");
        container.innerHTML = "";

        if (item.subtasks && item.subtasks.length > 0) {
            item.subtasks.forEach((s) => {
                addEditSubtaskRow(s.text);
            });
        }

        getEl("editBoardTaskModal").classList.remove("hidden");
    }

    function autoResizeTextarea(element) {
    element.style.height = "auto";
    element.style.height = (element.scrollHeight) + "px";
}

    function addEditSubtaskRow(text = "") {
    const container = getEl("editSubtasksContainer");

    const row = document.createElement("div");
    row.className = "flex items-start gap-2 mb-1";

    row.innerHTML = `
        <textarea 
            class="edit-subtask-input 
                w-full 
                p-2            border 
                rounded 
                text-sm 
                resize-y"       
            rows="2"           placeholder="Опис кроку">${text}</textarea>
        <button class="remove-subtask-btn text-red-500 text-lg mt-1">&times;</button>
    `;

    const textarea = row.querySelector(".edit-subtask-input");
    
    textarea.addEventListener("input", () => autoResizeTextarea(textarea));

    row.querySelector(".remove-subtask-btn").addEventListener("click", () => row.remove());
    container.appendChild(row);
}

    getEl("addEditSubtaskBtn").addEventListener("click", () => addEditSubtaskRow(""));

    async function updateBoardItem_withLogging(taskId, data) {

        await updateDoc(
            doc(db, 'artifacts', appId, 'public', 'data', 'board_items', taskId),
            data
        );

        const uid = auth?.currentUser?.uid || null;

        await addDoc(
            collection(db, 'artifacts', appId, 'public', 'data', 'board_activities'),
            {
                boardId: currentBoardId,
                type: "edit_task",
                performedBy: uid,
                itemId: taskId,
                itemText: data.text,
                timestamp: serverTimestamp()
            }
        );
    }

    async function saveEditBoardTask() {
        if (!editingBoardTask) return;

        const title = getEl("editBoardTaskTitle").value.trim();
        if (!title) return;

        const originalSubtasks = editingBoardTask.subtasks || [];
        
        const originalSubtaskMap = new Map();
        originalSubtasks.forEach(s => {

            originalSubtaskMap.set(s.text, s.completed); 
        });

        const subtasks = Array.from(
            document.querySelectorAll(".edit-subtask-input")
        )
        .map(el => {
            const text = el.value.trim();
            let completed = false;

            if (originalSubtaskMap.has(text)) {
                completed = originalSubtaskMap.get(text);
            } 

            return {
                text: text,
                completed: completed
            };
        })
        .filter(s => s.text !== "");

        await updateBoardItem_withLogging(editingBoardTask.id, {
            text: title,
            subtasks
        });

        getEl("editBoardTaskModal").classList.add("hidden");

        editingBoardTask = null;

        loadBoardTasks();
    }

    async function saveEditedBoard() {
        if (!editingBoard) return;

        const newTitle = getEl("editBoardTitleInput").value.trim();
        const newStatus = getEl("editBoardStatusSelect").value;
        if (!newTitle) {
            cancelEditBoard(); 
            return;
        }

        try {

            await updateDoc(
                doc(db, 'artifacts', appId, 'public', 'data', 'boards', editingBoard.id),
                { title: newTitle, status: newStatus } // Оновлено
            );

            if (editingBoard.id === currentBoardId) {
                const activeBoardTitleEl = getEl('activeBoardTitle');
                if (activeBoardTitleEl) activeBoardTitleEl.textContent = newTitle;
            }

            cancelEditBoard();

        } catch (e) {
            console.error("Помилка оновлення назви дошки:", e);
        }
    }

    function cancelEditBoard() {
        getEl("editBoardModal").classList.add("hidden"); 
        editingBoard = null;
    }
    getEl("saveEditBoardBtn").addEventListener("click", saveEditedBoard);

    function openEditBoardModal(board) {
        editingBoard = board; 
        
        getEl("editBoardTitleInput").value = board.title;
        
        // --- ДОДАНО ЛОГІКУ СТАТУСУ ---
        const statusSelect = getEl("editBoardStatusSelect");
        statusSelect.innerHTML = Object.keys(BOARD_STATUSES).map(key => 
            `<option value="${key}" ${board.status === key ? 'selected' : ''}>${BOARD_STATUSES[key].title}</option>`
        ).join('');
        // ------------------------------
        
        getEl("editBoardModal").classList.remove("hidden"); 
    }

    getEl("cancelEditBoardBtn").addEventListener("click", cancelEditBoard);

    getEl("saveEditBoardTaskBtn").addEventListener("click", saveEditBoardTask);

    getEl("cancelEditBoardTaskBtn").addEventListener("click", () => {
        getEl("editBoardTaskModal").classList.add("hidden");
        editingBoardTask = null;
    });

async function updateBoardItem_withLogging(taskId, data) {

        await updateDoc(
            doc(db, 'artifacts', appId, 'public', 'data', 'board_items', taskId),
            data
        );

        const uid = auth?.currentUser?.uid || null;

        await addDoc(
            collection(db, 'artifacts', appId, 'public', 'data', 'board_activities'),
            {
                boardId: currentBoardId,
                type: "edit_task",
                performedBy: uid,
                itemId: taskId,
                itemText: data.text,
                timestamp: serverTimestamp()
            }
        );
    }

    async function saveEditBoardTask() {
        if (!editingBoardTask) return;

        const title = getEl("editBoardTaskTitle").value.trim();
        if (!title) return;

        const originalSubtasks = editingBoardTask.subtasks || [];
        
        const originalSubtaskMap = new Map();
        originalSubtasks.forEach(s => {

            originalSubtaskMap.set(s.text, s.completed); 
        });

        const subtasks = Array.from(
            document.querySelectorAll(".edit-subtask-input")
        )
        .map(el => {
            const text = el.value.trim();
            let completed = false;

            if (originalSubtaskMap.has(text)) {
                completed = originalSubtaskMap.get(text);
            } 

            return {
                text: text,
                completed: completed
            };
        })
        .filter(s => s.text !== "");

        // --- ДОДАНО ЛОГІКУ ПЕРЕВІРКИ ЗАВЕРШЕННЯ ---
        const allCompleted = subtasks.length > 0 && subtasks.every(s => s.completed);
        // ------------------------------------------

        await updateBoardItem_withLogging(editingBoardTask.id, {
            text: title,
            subtasks,
            isCompleted: allCompleted, // Оновлюємо статус завершення
        });

        getEl("editBoardTaskModal").classList.add("hidden");

        editingBoardTask = null;

        loadBoardTasks();
    }

    const renderBoardTask = (item) => {
        const total = item.subtasks ? item.subtasks.length : 0;
        const done = item.subtasks ? item.subtasks.filter(s => s.completed).length : 0;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        const isCompleted = item.isCompleted === true; // Нове поле

        const el = document.createElement('div');
        el.className = `board-task-card p-3 mb-3 border rounded flex flex-col ${isCompleted ? 'completed-task-card bg-green-100 border-green-300 opacity-75' : 'bg-white'}`;
        el.style.minHeight = "80px";
        el.style.wordBreak = "break-word";
        el.style.overflowWrap = "break-word"; 
        el.style.whiteSpace = "normal";

        let subtasksHtml = '';
        if(item.subtasks) {
            subtasksHtml = item.subtasks.map((s, idx) => `
                <div class="flex items-start gap-2 mt-1">
                    <input type="checkbox" class="mt-1 cursor-pointer" ${s.completed ? 'checked' : ''} data-idx="${idx}">
                    <span class="text-sm ${s.completed ? 'line-through text-gray-400' : 'text-gray-700'} break-words">${s.text}</span>
                </div>
            `).join('');
        }

        el.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold text-gray-800 break-words ${isCompleted ? 'text-green-700' : ''}">${item.text}</h4>
                <div class="flex gap-2 flex-shrink-0">
                    <button class="text-blue-400 hover:text-blue-600 edit-item-btn"><i class="fas fa-edit"></i></button>
                    <button class="text-red-400 hover:text-red-600 delete-item-btn"><i class="fas fa-times"></i></button>
                </div>
            </div>
            ${total > 0 ? `
            <div class="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div class="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style="width: ${percent}%"></div>
            </div>
            <div class="text-xs text-gray-500 mb-2">${done}/${total} виконано</div>
            ` : ''}
            <div class="pl-1 space-y-1">
                ${subtasksHtml}
            </div>
        `;

        const deleteBtn = el.querySelector('.delete-item-btn');
        if (deleteBtn) deleteBtn.addEventListener('click', () => deleteBoardItem_withLogging(item.id));
        const editBtn = el.querySelector('.edit-item-btn');
        if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); openEditBoardTask(item); });
        el.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', (e) => toggleSubtask_withLogging(item, parseInt(e.target.dataset.idx), e.target.checked));
        });

        // Сортування: виконані завдання в кінець списку
        if (isCompleted) {
            boardTasksList.appendChild(el);
        } else {
            boardTasksList.prepend(el);
        }
    };

    const renderBoardSticker = (item) => {
        const el = document.createElement('div');
        el.className = `sticker ${item.color} p-4 w-full aspect-square flex flex-col relative transform rotate-1`;
        el.innerHTML = `
            <button class="absolute top-1 right-1 text-gray-600 hover:text-red-600 delete-sticker-btn"><i class="fas fa-times"></i></button>
            <div class="flex-grow flex items-center justify-center text-center font-medium text-gray-800 break-words overflow-hidden p-2">
                ${item.text}
            </div>
        `;
        el.querySelector('.delete-sticker-btn').addEventListener('click', () => deleteBoardItem_withLogging(item.id));
        boardStickersArea.appendChild(el);
    };

    const subscribeToBoardItems = (boardId) => {
        if(unsubscribeFromBoardItems) unsubscribeFromBoardItems();
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'board_items'), where('boardId', '==', boardId));
        unsubscribeFromBoardItems = onSnapshot(q, (snapshot) => {
            boardTasksList.innerHTML = '';
            boardStickersArea.innerHTML = '';
            snapshot.forEach(d => {
                const item = { id: d.id, ...d.data() };
                if(item.type === 'task') renderBoardTask(item);
                else if(item.type === 'sticker') renderBoardSticker(item);
            });
        }, error => console.error("Board items subscription error:", error));
    };

    const logBoardActivity = async (boardId, payload) => {
        try {
            if (!boardId || !userId) return;
            const data = { boardId, ...payload, performedBy: userId, timestamp: serverTimestamp() };
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'board_activities'), data);
        } catch (e) { console.error("Error logging board activity:", e); }
    };

    const boardReportModal = getEl('board-report-modal');
    const boardReportBody = getEl('board-report-body');
    const boardReportTitle = getEl('board-report-title');
    const boardReportSubtitle = getEl('board-report-subtitle');
    const boardReportClose = getEl('board-report-close');
    const boardReportFilterUser = getEl('board-report-filter-user');
    const boardReportFilterType = getEl('board-report-filter-type');
    const boardReportSearch = getEl('board-report-search');
    const boardReportDownload = getEl('board-report-download');

    let unsubscribeFromBoardActivities = null;
    let latestBoardActivities = [];

    const formatActivityText = (act) => {
        const actor = getDisplayNameFor(act.performedBy);
        switch(act.type) {
            case 'task_added': return `${actor} створив завдання: «${act.text || act.itemText || 'Без назви'}»`;
            case 'subtask_checked': return `${actor} викреслив пункт: «${act.subtaskText || '…'}»`;
            case 'subtask_unchecked': return `${actor} відновив пункт: «${act.subtaskText || '…'}»`;
            case 'sticker_added': return `${actor} додав стікер: «${act.stickerText || '…'}»`;
            case 'sticker_removed': return `${actor} видалив стікер: «${act.stickerText || '…'}»`;
            case 'task_deleted': return `${actor} видалив елемент`;
            default: return `${actor} зробив дію: ${act.type}`;
        }
    };

    const subscribeToBoardActivities = (boardId) => {
        if (unsubscribeFromBoardActivities) unsubscribeFromBoardActivities();
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'board_activities'), where('boardId', '==', boardId));
        unsubscribeFromBoardActivities = onSnapshot(q, (snapshot) => {
            latestBoardActivities = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
            renderBoardReport(latestBoardActivities);
            populateFilterUsers(latestBoardActivities);
        }, error => console.error("Board activities subscription error:", error));
    };

    const populateFilterUsers = (activities) => {
        const ids = new Set();
        activities.forEach(a => ids.add(a.performedBy));
        boardReportFilterUser.innerHTML = '<option value="">Усі користувачі</option>';
        Array.from(ids).forEach(id => {
            const name = getDisplayNameFor(id);
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = name;
            boardReportFilterUser.appendChild(opt);
        });
    };

    const renderBoardReport = (activities) => {
        const filterUser = boardReportFilterUser.value;
        const filterType = boardReportFilterType.value;
        const search = boardReportSearch.value.trim().toLowerCase();
        let filtered = activities.slice();
        if (filterUser) filtered = filtered.filter(a => a.performedBy === filterUser);
        if (filterType) filtered = filtered.filter(a => a.type === filterType);
        if (search) filtered = filtered.filter(a => {
            const text = (a.text || a.itemText || a.subtaskText || a.stickerText || '').toString().toLowerCase();
            return text.includes(search) || getDisplayNameFor(a.performedBy).toLowerCase().includes(search) || a.type.includes(search);
        });

        boardReportBody.innerHTML = '';
        const emptyEl = getEl('board-report-empty');
        if (!filtered || filtered.length === 0) { boardReportBody.appendChild(emptyEl); emptyEl.style.display = 'block'; return; }
        emptyEl.style.display = 'none';

        const grouped = {};
        filtered.forEach(a => {
            const d = a.timestamp?.toDate ? a.timestamp.toDate() : (a.timestamp ? new Date(a.timestamp) : new Date());
            const key = d.toISOString().slice(0,10);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(a);
        });

        Object.keys(grouped).sort((a,b) => b.localeCompare(a)).forEach(dayKey => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'py-2 text-sm font-semibold text-gray-600';
            const day = new Date(dayKey);
            dayHeader.textContent = day.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
            boardReportBody.appendChild(dayHeader);

            grouped[dayKey].sort((a,b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0)).forEach(act => {
                const item = document.createElement('div');
                item.className = 'timeline-item bg-white mb-3';
                const avatar = document.createElement('div');
                avatar.className = 'timeline-avatar';
                avatar.style.background = colorForUid(act.performedBy || 'x');
                avatar.textContent = getInitials(act.performedBy || '');
                const card = document.createElement('div');
                card.className = 'timeline-card';
                const title = document.createElement('div');
                title.className = 'text-sm';
                title.innerHTML = `<div class="timeline-badge">${formatActivityText(act)}</div>`;
                const meta = document.createElement('div');
                meta.className = 'timeline-meta';
                meta.textContent = `${fmtTime(act.timestamp)} • ${act.type}`;
                const detail = document.createElement('div');
                detail.className = 'text-sm text-gray-700 mt-2';
                const pieces = [];
                if (act.itemText) pieces.push(`Завдання: ${act.itemText}`);
                if (act.subtaskText) pieces.push(`Пункт: ${act.subtaskText}`);
                if (act.stickerText) pieces.push(`Стікeр: ${act.stickerText}`);
                if (pieces.length) detail.textContent = pieces.join(' • ');
                else detail.textContent = '';
                card.appendChild(title);
                if (detail.textContent) card.appendChild(detail);
                card.appendChild(meta);

                item.appendChild(avatar);
                item.appendChild(card);
                boardReportBody.appendChild(item);
            });
        });
    };

    const openBoardReport = () => {
        if (!currentBoardId) { showNotification('Помилка', 'Дошка не вибрана'); return; }
        boardReportTitle.textContent = `Звіт — ${activeBoardTitle.textContent || 'Дошка'}`;
        boardReportSubtitle.textContent = `Показано події для дошки`;
        boardReportModal.classList.remove('hidden');
        subscribeToBoardActivities(currentBoardId);
    };

    boardReportClose.addEventListener('click', () => {
        boardReportModal.classList.add('hidden');
        if (unsubscribeFromBoardActivities) { unsubscribeFromBoardActivities(); unsubscribeFromBoardActivities = null; }
    });

    boardReportFilterUser.addEventListener('change', () => renderBoardReport(latestBoardActivities));
    boardReportFilterType.addEventListener('change', () => renderBoardReport(latestBoardActivities));
    boardReportSearch.addEventListener('input', debounce(() => renderBoardReport(latestBoardActivities), 250));

    boardReportDownload.addEventListener('click', () => {
        const data = latestBoardActivities;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `board-${currentBoardId || 'report'}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    const addBoardTask_withLogging = async () => {
        const title = boardTaskTitle.value.trim();
        if(!title || !currentBoardId) return;

        const subtaskInputs = document.querySelectorAll('.subtask-input');
        const subtasks = Array.from(subtaskInputs).map(inp => ({
            text: inp.value.trim(),
            completed: false
        })).filter(s => s.text !== '');

        try {
            const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'board_items'), {
                boardId: currentBoardId,
                type: 'task',
                text: title,
                subtasks,
                createdAt: serverTimestamp()
            });

            await logBoardActivity(currentBoardId, {
                type: 'task_added',
                itemId: docRef.id,
                itemText: title
            });
            addBoardTaskModal.classList.add('hidden');
            boardTaskTitle.value = '';
            subtasksContainer.innerHTML = '<input type="text" placeholder="Крок 1" class="subtask-input w-full px-3 py-1.5 rounded border border-gray-200 text-sm">';
        } catch(e) { console.error("Error adding board task", e); }
    };

    async function updateBoardItem_withLogging(taskId, data) {

        await updateDoc(
            doc(db, 'artifacts', appId, 'public', 'data', 'board_items', taskId),
            data
        );

        const uid = auth?.currentUser?.uid || null;

        await addDoc(
            collection(db, 'artifacts', appId, 'public', 'data', 'board_activities'),
            {
                boardId: currentBoardId,
                type: "edit_task",
                performedBy: uid,
                itemId: taskId,
                itemText: data.text,
                timestamp: serverTimestamp()
            }
        );
    }

    async function saveEditBoardTask() {
        if (!editingBoardTask) return;

        const title = getEl("editBoardTaskTitle").value.trim();
        if (!title) return;

        const originalSubtasks = editingBoardTask.subtasks || [];
        
        const originalSubtaskMap = new Map();
        originalSubtasks.forEach(s => {

            originalSubtaskMap.set(s.text, s.completed); 
        });

        const subtasks = Array.from(
            document.querySelectorAll(".edit-subtask-input")
        )
        .map(el => {
            const text = el.value.trim();
            let completed = false;

            if (originalSubtaskMap.has(text)) {
                completed = originalSubtaskMap.get(text);
            } 

            return {
                text: text,
                completed: completed
            };
        })
        .filter(s => s.text !== "");

        // --- ДОДАНО ЛОГІКУ ПЕРЕВІРКИ ЗАВЕРШЕННЯ ---
        const allCompleted = subtasks.length > 0 && subtasks.every(s => s.completed);
        // ------------------------------------------

        await updateBoardItem_withLogging(editingBoardTask.id, {
            text: title,
            subtasks,
            isCompleted: allCompleted, // Оновлюємо статус завершення
        });

        getEl("editBoardTaskModal").classList.add("hidden");

        editingBoardTask = null;

        loadBoardTasks();
    }

    // --- ОНОВЛЕНА ФУНКЦІЯ toggleSubtask_withLogging ---
    const toggleSubtask_withLogging = async (item, idx, isChecked) => {
        try {
            if (!item || !Array.isArray(item.subtasks)) return;
            const newSubtasks = JSON.parse(JSON.stringify(item.subtasks));
            const oldText = newSubtasks[idx]?.text || '';
            newSubtasks[idx].completed = isChecked;

            // Перевіряємо, чи всі підзавдання виконані
            const allCompleted = newSubtasks.length > 0 && newSubtasks.every(s => s.completed);

            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'board_items', item.id), {
                subtasks: newSubtasks,
                isCompleted: allCompleted, // Оновлюємо статус завершення
            });

            await logBoardActivity(item.boardId || currentBoardId, {
                type: isChecked ? 'subtask_checked' : 'subtask_unchecked',
                itemId: item.id,
                subtaskIdx: idx,
                subtaskText: oldText
            });
        } catch (e) { console.error("Error toggling subtask:", e); }
    };

    const addSticker_withLogging = async () => {
        try {
            const text = stickerTextInput.value.trim();
            if(!text || !currentBoardId) return;
            const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'board_items'), {
                boardId: currentBoardId,
                type: 'sticker',
                text,
                color: selectedStickerColor,
                createdAt: serverTimestamp()
            });
            await logBoardActivity(currentBoardId, {
                type: 'sticker_added',
                itemId: docRef.id,
                stickerText: text,
                stickerColor: selectedStickerColor
            });
            addStickerModal.classList.add('hidden');
            stickerTextInput.value = '';
        } catch(e) { console.error("Error adding sticker", e); }
    };

    const deleteBoardItem_withLogging = async (itemId) => {
        try {
            if (!confirm('Видалити цей елемент?')) return;
            const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'board_items', itemId);
            const snapshot = await getDoc(itemRef);
            if (!snapshot.exists()) { console.warn('Item not found for deletion', itemId); return; }
            const item = { id: snapshot.id, ...snapshot.data() };
            if(item.type === 'sticker') {
                await logBoardActivity(item.boardId || currentBoardId, {
                    type: 'sticker_removed',
                    itemId: item.id,
                    stickerText: item.text,
                    stickerColor: item.color
                });
            } else {
                await logBoardActivity(item.boardId || currentBoardId, {
                    type: 'task_deleted',
                    itemId: item.id,
                    itemText: item.text
                });
            }
            await deleteDoc(itemRef);
        } catch (e) {
            console.error("Error deleting board item with logging:", e);
        }
    };

    const BOARD_STATUSES = {
        'New': { title: 'Нове', color: 'bg-indigo-500', text: 'text-white' },
        'Question': { title: 'Питання', color: 'bg-yellow-500', text: 'text-gray-800' },
        'Completed': { title: 'Виконано', color: 'bg-green-500', text: 'text-white' }
    };

    const getBoardStatusTag = (statusKey) => {
        const status = BOARD_STATUSES[statusKey] || BOARD_STATUSES.New;
        return `<span class="board-status-tag text-xs font-semibold px-2 py-0.5 rounded-full ${status.color} ${status.text} absolute top-1 right-1/2 translate-x-1/2">${status.title}</span>`;
    };

    const subscribeToBoards = () => {
        if(!userId) return;
        // Сортуємо: Completed дошки йдуть в кінець
        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'boards'), 
            where('members', 'array-contains', userId),
            orderBy('status', 'asc') 
        );
        unsubscribeFromBoards = onSnapshot(q, (snapshot) => {
            boardsGrid.innerHTML = '';
            if(snapshot.empty) {
                boardsGrid.innerHTML = `<p class="text-center col-span-3 text-gray-500">Ви ще не маєте спільних дошок.</p>`;
                return;
            }
            snapshot.forEach(docSnap => {
                const board = { id: docSnap.id, ...docSnap.data() };
                const isOwner = board.ownerId === userId;
                const status = board.status || 'New';
                const isCompleted = status === 'Completed';

                const el = document.createElement('div');
                el.className = `bg-white p-6 rounded-xl shadow-lg border cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 relative group ${isCompleted ? 'border-green-300 bg-green-50' : 'border-orange-100'}`;

                const deleteBtnHtml = isOwner 
                    ? `<button class="delete-board-btn absolute top-2 right-2 text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${board.id}" title="Видалити дошку"><i class="fas fa-trash-alt"></i></button>`
                    : '';

                const editBtnHtml = isOwner
                    ? `<button class="edit-board-btn absolute top-2 left-2 text-gray-300 hover:text-blue-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${board.id}" title="Редагувати назву"><i class="fas fa-edit"></i></button>`
                    : '';
                
                // --- ДОДАНО ВИКЛИК СТАТУСУ ---
                const statusTagHtml = getBoardStatusTag(status);
                // ------------------------------

                el.innerHTML = `
                    <h3 class="font-bold text-xl text-gray-800 mb-2 pr-6">${board.title}</h3>
                    <p class="text-sm text-gray-500"><i class="fas fa-user-friends"></i> ${board.members ? board.members.length : 0} учасників</p>
                    ${deleteBtnHtml}
                    ${editBtnHtml}
                    ${statusTagHtml}
                `;

                el.addEventListener('click', (e) => {
                    if(e.target.closest('.delete-board-btn') || e.target.closest('.edit-board-btn')) return;
                    openActiveBoard(board);
                });

                if(isOwner && el.querySelector('.delete-board-btn')) {
                    el.querySelector('.delete-board-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        showConfirmModal(() => deleteBoard(board.id), `Видалити дошку "${board.title}"? Це видалить всі завдання та стікери на ній.`, "Видалити");
                    });
                }

                if(isOwner && el.querySelector('.edit-board-btn')) {
                    el.querySelector('.edit-board-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        openEditBoardModal(board);
                    });
                }

                boardsGrid.appendChild(el);
            });
        });
    };

    const createBoard = async () => {
        const title = boardNameInput.value.trim();
        if(!title || !userId) return;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'boards'), {
                title,
                ownerId: userId,
                members: [userId],
                status: 'New', // Встановлюємо початковий статус
                createdAt: serverTimestamp()
            });
            createBoardModal.classList.add('hidden');
            boardNameInput.value = '';
        } catch(e) { console.error("Error creating board", e); }
    };

    const deleteBoard = async (boardId) => {
        if(!boardId || !userId) return;
        try {
            const itemsQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'board_items'), where('boardId', '==', boardId));
            const itemsSnapshot = await getDocs(itemsQuery);
            const batch = writeBatch(db);
            itemsSnapshot.forEach(d => batch.delete(d.ref));
            batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'boards', boardId));
            await batch.commit();
            showNotification('Успіх', 'Дошку успішно видалено.');
        } catch(e) {
            console.error("Error deleting board:", e);
            showNotification('Помилка', 'Не вдалося видалити дошку.');
        }
    };

    const openActiveBoard = (board) => {
        currentBoardId = board.id;
        activeBoardTitle.textContent = board.title;
        // Можна також відобразити статус тут
        // const status = BOARD_STATUSES[board.status || 'New'].title;
        // activeBoardTitle.insertAdjacentHTML('afterend', ` <span class="text-sm">(${status})</span>`);
        
        getEl('board-member-count').textContent = board.members.length;
        boardsListView.classList.add('hidden');
        activeBoardView.classList.remove('hidden');
        activeBoardView.classList.add('flex');
        switchMobileTab('tasks');
        boardFriendSelect.innerHTML = '<option value="">Виберіть друга</option>';
        Object.values(friendsCache).forEach(f => {
            if(!board.members.includes(f.userId)) {
                boardFriendSelect.innerHTML += `<option value="${f.userId}">${f.name}</option>`;
            }
        });
        subscribeToBoardItems(board.id);

        (function addBoardReportButton() {
            try {
                const header = document.querySelector('#active-board-title')?.parentElement;
                if (!header) return;
                // Прибираємо старий звіт, якщо він був
                const oldReportBtn = getEl('open-board-report-btn');
                if (oldReportBtn) oldReportBtn.remove();
                
                const btn = document.createElement('button');
                btn.id = 'open-board-report-btn';
                btn.className = 'px-3 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm';
                btn.textContent = 'Звіт';
                btn.addEventListener('click', openBoardReport);
                header.appendChild(btn);
            } catch (e) { console.error(e); }
        })();

        subscribeToBoardActivities(board.id);
    };

        (function addBoardReportButton() {
            try {
                const header = document.querySelector('#active-board-title')?.parentElement;
                if (!header) return;
                if (getEl('open-board-report-btn')) return;
                const btn = document.createElement('button');
                btn.id = 'open-board-report-btn';
                btn.className = 'px-3 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm';
                btn.textContent = 'Звіт';
                btn.addEventListener('click', openBoardReport);
                header.appendChild(btn);
            } catch (e) { console.error(e); }
        })();

        subscribeToBoardActivities(board.id);
    };

    saveBoardTaskBtn.addEventListener('click', addBoardTask_withLogging);
    saveStickerBtn.addEventListener('click', addSticker_withLogging);

    const addBoardMember = async () => {
        const friendId = boardFriendSelect.value;
        if(!friendId || !currentBoardId) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'boards', currentBoardId), { members: arrayUnion(friendId) });
            addBoardMemberModal.classList.add('hidden');
            const currentCount = parseInt(getEl('board-member-count').textContent);
            getEl('board-member-count').textContent = currentCount + 1;
        } catch(e) { console.error("Error adding member", e); }
    };

    googleSignInButton.addEventListener('click', signInWithGoogle);
    signOutButton.addEventListener('click', signOutUser);
    addTaskButton.addEventListener('click', addTask);
    confirmDeleteButton.addEventListener('click', () => { if (currentAction) currentAction(); hideConfirmModal(); });
    cancelDeleteButton.addEventListener('click', hideConfirmModal);
    closeNotificationBtn.addEventListener('click', hideNotification);
    saveEditBtn.addEventListener('click', saveEditedTask);
    cancelEditBtn.addEventListener('click', hideViewEditModal);
    saveSettingsBtn.addEventListener('click', saveSettings);
    const toggleSection = (listEl, btnEl) => { listEl.classList.toggle('hidden'); btnEl.textContent = listEl.classList.contains('hidden') ? 'Розгорнути' : 'Згорнути'; saveExpansionState(); };
    deferredToggleBtn.addEventListener('click', () => toggleSection(deferredTasksList, deferredToggleBtn));
    completedToggleBtn.addEventListener('click', () => toggleSection(completedTasksList, completedToggleBtn));
    settingsToggleBtn.addEventListener('click', () => toggleSection(settingsContent, settingsToggleBtn));
    friendsToggleBtn.addEventListener('click', () => toggleSection(friendsContent, friendsToggleBtn));
    addFriendOpenBtn.addEventListener('click', showAddFriendModal);
    cancelFriendBtn.addEventListener('click', hideAddFriendModal);
    saveFriendBtn.addEventListener('click', saveFriend);
    assignTaskOpenBtn.addEventListener('click', showAssignTaskModal);
    cancelAssignBtn.addEventListener('click', hideAssignTaskModal);
    sendTaskBtn.addEventListener('click', sendAssignedTask);
    chatsBtn.addEventListener('click', openChatView);
    backToTasksBtn.addEventListener('click', closeChatView);
    enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
    closeImageViewerBtn.addEventListener('click', () => imageViewerModal.classList.add('hidden'));
    attachFileBtn.addEventListener('click', () => imageUploadInput.click());
    imageUploadInput.addEventListener('change', (e) => { if (e.target.files[0]) uploadImageAndSendMessage(e.target.files[0]); });

    reportBtn.addEventListener('click', openReportView);
    backToTasksFromReportBtn.addEventListener('click', closeReportView);
    reportTableBody.addEventListener('click', (e) => {
        const card = e.target.closest('.report-task-card');
        if (card && card.dataset.taskText) {
            showTaskDetailsModal(card.dataset.taskText, card.dataset.taskId);
        }
    });
    closeTaskDetailsBtn.addEventListener('click', hideTaskDetailsModal);
    deleteFromReportBtn.addEventListener('click', () => {
        showConfirmModal(
            () => deleteSharedTaskFromReport(),
            "Ви впевнені, що хочете назавжди видалити це завдання зі звіту? Цю дію не можна скасувати.",
            "Так, видалити"
        );
    });

    incomingTaskAcceptBtn.addEventListener('click', () => {
        if (currentIncomingTask) {
            acceptIncomingTask(currentIncomingTask);
            hideViewIncomingTaskModal();
        }
    });

    incomingTaskDeclineBtn.addEventListener('click', () => {
        if (currentIncomingTask) {
            updateSharedTaskStatus(currentIncomingTask.id, 'declined');
            hideViewIncomingTaskModal();
        }
    });

    incomingTaskCloseBtn.addEventListener('click', hideViewIncomingTaskModal);

    cancelActionsBtn.addEventListener('click', hideTaskActionsModal);

    actionDeferBtn.addEventListener('click', () => {
        if (currentTaskForAction) {
            updateTaskStatus(currentTaskForAction.id, 'deferred', currentTaskForAction.originalSharedTaskId);
            hideTaskActionsModal();
        }
    });

    actionActivateBtn.addEventListener('click', () => {
        if(currentTaskForAction) {
            updateTaskStatus(currentTaskForAction.id, 'active', currentTaskForAction.originalSharedTaskId);
            hideTaskActionsModal();
        }
    });

    actionProlongBtn.addEventListener('click', () => {
        if (currentTaskForAction) {
            prolongTask(currentTaskForAction.id);
            hideTaskActionsModal();
        }
    });

    actionDeleteBtn.addEventListener('click', () => {
        if (currentTaskForAction) {
            const taskToDelete = currentTaskForAction;
            hideTaskActionsModal();
            showConfirmModal(() => deleteTask(taskToDelete), "Видалити це завдання?", "Видалити");
        }
    });

    resourcesBtn.addEventListener('click', openResourcesView);
    backToTasksFromResourcesBtn.addEventListener('click', closeResourcesView);
    addShelfBtn.addEventListener('click', () => { shelfNameInput.value = ''; addShelfModal.classList.remove('hidden'); });
    cancelShelfBtn.addEventListener('click', () => addShelfModal.classList.add('hidden'));
    saveShelfBtn.addEventListener('click', addShelf);
    cancelResourceBtn.addEventListener('click', () => addResourceModal.classList.add('hidden'));
    saveResourceBtn.addEventListener('click', addResource);
    resourcesSearchInput.addEventListener('input', filterAndRenderResources);

    const handleSendMessage = () => { if (!selectedFriendForChat) { showNotification('Помилка', 'Будь ласка, спочатку виберіть друга зі списку.'); return; } sendChatMessage({ text: chatMessageInput.value, recipient: selectedFriendForChat }); };
    sendChatMessageBtn.addEventListener('click', handleSendMessage);
    chatMessageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSendMessage(); });

    boardsBtn.addEventListener('click', () => { mainContent.classList.add('hidden'); boardsSection.classList.remove('hidden'); subscribeToBoards(); });
    backToTasksFromBoardsBtn.addEventListener('click', () => { boardsSection.classList.add('hidden'); mainContent.classList.remove('hidden'); if(unsubscribeFromBoards) unsubscribeFromBoards(); });
    createBoardBtn.addEventListener('click', () => { boardNameInput.value = ''; createBoardModal.classList.remove('hidden'); });
    cancelBoardBtn.addEventListener('click', () => createBoardModal.classList.add('hidden'));
    saveBoardBtn.addEventListener('click', createBoard);
    backToBoardsListBtn.addEventListener('click', () => { activeBoardView.classList.add('hidden'); activeBoardView.classList.remove('flex'); boardsListView.classList.remove('hidden'); if(unsubscribeFromBoardItems) unsubscribeFromBoardItems(); });

    addBoardMemberBtn.addEventListener('click', () => addBoardMemberModal.classList.remove('hidden'));
    cancelBoardMemberBtn.addEventListener('click', () => addBoardMemberModal.classList.add('hidden'));
    saveBoardMemberBtn.addEventListener('click', addBoardMember);

    addBoardTaskBtn.addEventListener('click', () => {
        boardTaskTitle.value = '';
        subtasksContainer.innerHTML = '<input type="text" placeholder="Крок 1" class="subtask-input w-full px-3 py-1.5 rounded border border-gray-200 text-sm">';
        addBoardTaskModal.classList.remove('hidden');
    });
    cancelBoardTaskBtn.addEventListener('click', () => addBoardTaskModal.classList.add('hidden'));
    addSubtaskFieldBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Крок ${subtasksContainer.children.length + 1}`;
        input.className = 'subtask-input w-full px-3 py-1.5 rounded border border-gray-200 text-sm';
        subtasksContainer.appendChild(input);
    });

    addStickerBtn.addEventListener('click', () => { stickerTextInput.value = ''; addStickerModal.classList.remove('hidden'); });
    cancelStickerBtn.addEventListener('click', () => addStickerModal.classList.add('hidden'));

    mobileTabTasks.addEventListener('click', () => switchMobileTab('tasks'));
    mobileTabStickers.addEventListener('click', () => switchMobileTab('stickers'));

    document.querySelectorAll('.color-option').forEach(el => {
        el.addEventListener('click', (e) => {
            document.querySelectorAll('.color-option').forEach(c => c.classList.remove('border-gray-600'));
            e.target.classList.add('border-gray-600');
            selectedStickerColor = e.target.dataset.color;
        });
    });

    saveBoardTaskBtn.addEventListener('click', addBoardTask_withLogging);
    saveStickerBtn.addEventListener('click', addSticker_withLogging);

    onAuthStateChanged(auth, async (user) => {
        loadingSpinner.classList.add('hidden');
        if (user) {
            userId = user.uid;
            userIdSpan.textContent = userId;
            authButtons.classList.add('hidden');
            contentSection.classList.remove('hidden');
            await loadSettings();
            subscribeToFriends();
            subscribeToTasks();
            subscribeToIncomingTasks();
            subscribeToUnreadCounts();
            checkNotificationStatus();
            subscribeToBoards(); // ДОДАНО
        } else {
            userId = null;
            userIdSpan.textContent = 'Немає';
            authButtons.classList.remove('hidden');
            contentSection.classList.add('hidden');
            chatSection.classList.add('hidden');
            reportSection.classList.add('hidden');
            resourcesSection.classList.add('hidden');
            boardsSection.classList.add('hidden');
        }
    });

    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    if (initialAuthToken) { signInWithCustomToken(auth, initialAuthToken).catch(() => signInAnonymously(auth)); } else { signInAnonymously(auth); }
  ;