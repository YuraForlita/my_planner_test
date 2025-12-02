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
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);
    const provider = new GoogleAuthProvider();

    // --- КОНСТАНТИ ТА ЗМІННІ СТАНУ ---

    let userId = null;
    let currentBoardId = null;
    let unsubscribeFromBoards = null;
    let unsubscribeFromBoardActivities = null;
    let latestBoardActivities = [];
    let selectedStickerColor = 'yellow';
    let editingBoard = null; // Для модального вікна редагування дошки
    let editingBoardTask = null; // Для модального вікна редагування завдання
    let currentTaskForAction = null;
    let currentIncomingTask = null;
    let currentAction = null;
    let selectedFriendForChat = null;
    let unsubscribeFromBoardItems = null;

    const BOARD_STATUSES = {
        'New': { title: 'Нове', color: 'bg-indigo-500', text: 'text-white' },
        'Question': { title: 'Питання', color: 'bg-yellow-500', text: 'text-gray-800' },
        'Completed': { title: 'Виконано', color: 'bg-green-500', text: 'text-white' }
    };

    // --- ДОПОМІЖНА ФУНКЦІЯ ---
    function getEl(id) {
        return document.getElementById(id);
    }

    // --- ОГОЛОШЕННЯ ЕЛЕМЕНТІВ DOM (Уніфікований блок) ---
    const loadingSpinner = getEl('loading-spinner'),
        userIdSpan = getEl('user-id-span'),
        authButtons = getEl('auth-buttons'),
        googleSignInButton = getEl('google-sign-in-button'),
        signOutButton = getEl('sign-out-button'),
        contentSection = getEl('content-section'),
        mainContent = getEl('main-content'),
        addTaskButton = getEl('add-task-button'),
        confirmDeleteButton = getEl('confirm-delete-button'),
        cancelDeleteButton = getEl('cancel-delete-button'),
        confirmModal = getEl('confirm-modal'),
        notificationModal = getEl('notification-modal'),
        notificationTitle = getEl('notification-title'),
        notificationMessage = getEl('notification-message'),
        closeNotificationBtn = getEl('close-notification-btn'),
        tasksList = getEl('tasks-list'),
        deferredTasksList = getEl('deferred-tasks-list'),
        completedTasksList = getEl('completed-tasks-list'),
        deferredToggleBtn = getEl('deferred-toggle-btn'),
        completedToggleBtn = getEl('completed-toggle-btn'),
        viewEditTaskModal = getEl('view-edit-task-modal'),
        editTaskTitle = getEl('edit-task-title'),
        editTaskNotes = getEl('edit-task-notes'),
        editTaskDueDate = getEl('edit-task-due-date'),
        editTaskReminderDate = getEl('edit-task-reminder-date'),
        editTaskStatus = getEl('edit-task-status'),
        editTaskPriority = getEl('edit-task-priority'),
        saveEditBtn = getEl('save-edit-btn'),
        cancelEditBtn = getEl('cancel-edit-btn'),
        settingsToggleBtn = getEl('settings-toggle-btn'),
        settingsContent = getEl('settings-content'),
        enableNotificationsBtn = getEl('enable-notifications-btn'),
        settingsTimezone = getEl('settings-timezone'),
        saveSettingsBtn = getEl('save-settings-btn'),
        friendsToggleBtn = getEl('friends-toggle-btn'),
        friendsContent = getEl('friends-content'),
        friendsList = getEl('friends-list'),
        addFriendOpenBtn = getEl('add-friend-open-btn'),
        addFriendModal = getEl('add-friend-modal'),
        friendEmailInput = getEl('friend-email-input'),
        saveFriendBtn = getEl('save-friend-btn'),
        cancelFriendBtn = getEl('cancel-friend-btn'),
        assignTaskOpenBtn = getEl('assign-task-open-btn'),
        assignTaskModal = getEl('assign-task-modal'),
        assignTaskTitle = getEl('assign-task-title'),
        assignFriendSelect = getEl('assign-friend-select'),
        sendTaskBtn = getEl('send-task-btn'),
        cancelAssignBtn = getEl('cancel-assign-btn'),
        incomingTasksList = getEl('incoming-tasks-list'),
        incomingTasksCount = getEl('incoming-tasks-count'),
        viewIncomingTaskModal = getEl('view-incoming-task-modal'),
        incomingTaskTitle = getEl('incoming-task-title'),
        incomingTaskDetails = getEl('incoming-task-details'),
        incomingTaskAcceptBtn = getEl('incoming-task-accept-btn'),
        incomingTaskDeclineBtn = getEl('incoming-task-decline-btn'),
        incomingTaskCloseBtn = getEl('incoming-task-close-btn'),
        chatsBtn = getEl('chats-btn'),
        chatSection = getEl('chat-section'),
        backToTasksBtn = getEl('back-to-tasks-btn'),
        friendsChatList = getEl('friends-chat-list'),
        chatBox = getEl('chat-box'),
        chatMessages = getEl('chat-messages'),
        chatHeader = getEl('chat-header'),
        chatMessageInput = getEl('chat-message-input'),
        sendChatMessageBtn = getEl('send-chat-message-btn'),
        imageUploadInput = getEl('image-upload-input'),
        attachFileBtn = getEl('attach-file-btn'),
        imageViewerModal = getEl('image-viewer-modal'),
        imageViewerContent = getEl('image-viewer-content'),
        closeImageViewerBtn = getEl('close-image-viewer-btn'),
        reportBtn = getEl('report-btn'),
        reportSection = getEl('report-section'),
        backToTasksFromReportBtn = getEl('back-to-tasks-from-report-btn'),
        reportTableBody = getEl('report-table-body'),
        taskDetailsModal = getEl('task-details-modal'),
        taskDetailsText = getEl('task-details-text'),
        taskDetailsStatus = getEl('task-details-status'),
        taskDetailsOwner = getEl('task-details-owner'),
        deleteFromReportBtn = getEl('delete-from-report-btn'),
        closeTaskDetailsBtn = getEl('close-task-details-btn'),
        taskActionsModal = getEl('task-actions-modal'),
        actionDeferBtn = getEl('action-defer-btn'),
        actionActivateBtn = getEl('action-activate-btn'),
        actionProlongBtn = getEl('action-prolong-btn'),
        actionDeleteBtn = getEl('action-delete-btn'),
        cancelActionsBtn = getEl('cancel-actions-btn'),
        resourcesBtn = getEl('resources-btn'),
        resourcesSection = getEl('resources-section'),
        backToTasksFromResourcesBtn = getEl('back-to-tasks-from-resources-btn'),
        shelvesList = getEl('shelves-list'),
        resourcesContainer = getEl('resources-container'),
        addShelfBtn = getEl('add-shelf-btn'),
        addShelfModal = getEl('add-shelf-modal'),
        shelfNameInput = getEl('shelf-name-input'),
        saveShelfBtn = getEl('save-shelf-btn'),
        cancelShelfBtn = getEl('cancel-shelf-btn'),
        addResourceModal = getEl('add-resource-modal'),
        resourceTitleInput = getEl('resource-title-input'),
        resourceLinkInput = getEl('resource-link-input'),
        resourceShelfSelect = getEl('resource-shelf-select'),
        saveResourceBtn = getEl('save-resource-btn'),
        cancelResourceBtn = getEl('cancel-resource-btn'),
        resourcesSearchInput = getEl('resources-search-input'),
        boardsBtn = getEl('boards-btn'),
        boardsSection = getEl('boards-section'),
        backToTasksFromBoardsBtn = getEl('back-to-tasks-from-boards-btn'),
        boardsGrid = getEl('boards-grid'),
        createBoardBtn = getEl('create-board-btn'),
        createBoardModal = getEl('create-board-modal'),
        boardNameInput = getEl('board-name-input'),
        saveBoardBtn = getEl('save-board-btn'),
        cancelBoardBtn = getEl('cancel-board-btn'),
        boardsListView = getEl('boards-list-view'),
        activeBoardView = getEl('active-board-view'),
        activeBoardTitle = getEl('active-board-title'),
        backToBoardsListBtn = getEl('back-to-boards-list-btn'),
        addBoardMemberBtn = getEl('add-board-member-btn'),
        addBoardMemberModal = getEl('add-board-member-modal'),
        boardFriendSelect = getEl('board-friend-select'),
        saveBoardMemberBtn = getEl('save-board-member-btn'),
        cancelBoardMemberBtn = getEl('cancel-board-member-btn'),
        boardTasksList = getEl('board-tasks-list'),
        addBoardTaskBtn = getEl('add-board-task-btn'),
        addBoardTaskModal = getEl('add-board-task-modal'),
        boardTaskTitle = getEl('board-task-title'),
        subtasksContainer = getEl('subtasks-container'),
        addSubtaskFieldBtn = getEl('add-subtask-field-btn'),
        saveBoardTaskBtn = getEl('save-board-task-btn'), 
        cancelBoardTaskBtn = getEl('cancel-board-task-btn'),
        boardStickersArea = getEl('board-stickers-area'),
        addStickerBtn = getEl('add-sticker-btn'),
        addStickerModal = getEl('add-sticker-modal'),
        stickerTextInput = getEl('sticker-text-input'),
        saveStickerBtn = getEl('save-sticker-btn'),
        cancelStickerBtn = getEl('cancel-sticker-btn'),
        mobileTabTasks = getEl('mobile-tab-tasks'),
        mobileTabStickers = getEl('mobile-tab-stickers'),
        boardTasksColumn = getEl('board-tasks-column'),
        boardStickersColumn = getEl('board-stickers-column'),
        boardReportModal = getEl('board-report-modal'),
        boardReportBody = getEl('board-report-body'),
        boardReportTitle = getEl('board-report-title'),
        boardReportSubtitle = getEl('board-report-subtitle'),
        boardReportClose = getEl('board-report-close'),
        boardReportFilterUser = getEl('board-report-filter-user'),
        boardReportFilterType = getEl('board-report-filter-type'),
        boardReportSearch = getEl('board-report-search'),
        boardReportDownload = getEl('board-report-download'),
        editBoardModal = getEl('edit-board-modal'), // Доданий елемент для редагування дошки
        editBoardTitleInput = getEl('editBoardTitleInput'), // Доданий елемент
        editBoardStatusSelect = getEl('editBoardStatusSelect'), // Доданий елемент
        saveEditBoardBtn = getEl('saveEditBoardBtn'), // Доданий елемент
        cancelEditBoardBtn = getEl('cancelEditBoardBtn'); // Доданий елемент
    

    // --- ФУНКЦІЇ АУТЕНТИФІКАЦІЇ ---

    async function signInWithGoogle() {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Помилка входу через Google:", error);
            showNotification('Помилка', 'Не вдалося увійти через Google. Спробуйте пізніше.');
        }
    }

    async function signOutUser() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Помилка виходу:", error);
            showNotification('Помилка', 'Не вдалося вийти. Спробуйте пізніше.');
        }
    }

    // --- ФУНКЦІЇ МОДАЛЬНИХ ВІКОН ТА СПОВІЩЕНЬ ---

    function showNotification(title, message) {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        notificationModal.classList.remove('hidden');
    }

    function hideNotification() {
        notificationModal.classList.add('hidden');
    }

    function showConfirmModal(action, message, buttonText = "Підтвердити") {
        currentAction = action;
        getEl('confirm-message').textContent = message;
        confirmDeleteButton.textContent = buttonText;
        confirmModal.classList.remove('hidden');
    }

    function hideConfirmModal() {
        currentAction = null;
        confirmModal.classList.add('hidden');
    }

    function hideViewEditModal() {
        viewEditTaskModal.classList.add('hidden');
    }

    function hideAddFriendModal() {
        addFriendModal.classList.add('hidden');
        friendEmailInput.value = '';
    }

    function showAddFriendModal() {
        addFriendModal.classList.remove('hidden');
    }

    function hideAssignTaskModal() {
        assignTaskModal.classList.add('hidden');
    }

    function hideViewIncomingTaskModal() {
        viewIncomingTaskModal.classList.add('hidden');
    }

    function hideTaskDetailsModal() {
        taskDetailsModal.classList.add('hidden');
    }

    function hideTaskActionsModal() {
        taskActionsModal.classList.add('hidden');
        currentTaskForAction = null;
    }

    // --- ФУНКЦІЇ ЗБЕРІГАННЯ ---

    function saveExpansionState() {
        if (!userId) return;
        const state = {
            deferred: !deferredTasksList.classList.contains('hidden'),
            completed: !completedTasksList.classList.contains('hidden'),
            settings: !settingsContent.classList.contains('hidden'),
            friends: !friendsContent.classList.contains('hidden'),
        };
        localStorage.setItem(`expansionState_${userId}`, JSON.stringify(state));
    }

    function loadExpansionState() {
        if (!userId) return;
        const state = JSON.parse(localStorage.getItem(`expansionState_${userId}`));
        if (state) {
            if (state.deferred === false) toggleSection(deferredTasksList, deferredToggleBtn, true);
            if (state.completed === false) toggleSection(completedTasksList, completedToggleBtn, true);
            if (state.settings === false) toggleSection(settingsContent, settingsToggleBtn, true);
            if (state.friends === false) toggleSection(friendsContent, friendsToggleBtn, true);
        }
    }

    // --- ФУНКЦІЇ ЗАВДАНЬ ---

    function addTask() {
        const text = prompt("Введіть нове завдання:");
        if (text && userId) {
            addDoc(collection(db, 'artifacts', appId, 'users', userId, 'tasks'), {
                text,
                status: 'active',
                isCompleted: false,
                createdAt: serverTimestamp(),
                notes: '',
                dueDate: null,
                reminderDate: null,
                priority: 'medium',
                ownerId: userId // Додано власника
            }).catch(e => console.error("Помилка додавання завдання:", e));
        }
    }

    function updateTask(id, data) {
        if (!userId) return;
        updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'tasks', id), data)
            .catch(e => console.error("Помилка оновлення завдання:", e));
    }

    function deleteTask(task) {
        if (!userId) return;
        const taskRef = doc(db, 'artifacts', appId, 'users', userId, 'tasks', task.id);
        deleteDoc(taskRef).catch(e => console.error("Помилка видалення завдання:", e));

        if (task.originalSharedTaskId) {
            updateSharedTaskStatus(task.originalSharedTaskId, 'completed');
        }
    }

    function toggleTaskCompleted(id, isCompleted) {
        if (!userId) return;
        updateTask(id, { isCompleted, completedAt: isCompleted ? serverTimestamp() : null });
    }

    function renderTask(task) {
        const el = document.createElement('div');
        const isDeferred = task.status === 'deferred';
        const isCompleted = task.isCompleted;

        el.className = `task-card flex items-center justify-between p-3 mb-2 rounded shadow-sm cursor-pointer transition-all ${isCompleted ? 'bg-green-100 opacity-70' : isDeferred ? 'bg-yellow-100' : 'bg-white hover:shadow-md'}`;
        el.innerHTML = `
            <div class="flex items-center space-x-3 w-11/12">
                <input type="checkbox" class="task-checkbox h-4 w-4" ${isCompleted ? 'checked' : ''} data-id="${task.id}">
                <span class="task-text flex-grow ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}">${task.text}</span>
            </div>
            <button class="text-gray-400 hover:text-gray-600 action-menu-btn" data-id="${task.id}"><i class="fas fa-ellipsis-v"></i></button>
        `;

        el.querySelector('.task-checkbox').addEventListener('change', (e) => toggleTaskCompleted(task.id, e.target.checked));
        el.querySelector('.task-text').addEventListener('click', () => openViewEditModal(task));
        el.querySelector('.action-menu-btn').addEventListener('click', (e) => showTaskActionsModal(task, e));

        if (isCompleted) {
            completedTasksList.appendChild(el);
        } else if (isDeferred) {
            deferredTasksList.appendChild(el);
        } else {
            tasksList.appendChild(el);
        }
    }

    function subscribeToTasks() {
        if (!userId) return;
        const q = query(
            collection(db, 'artifacts', appId, 'users', userId, 'tasks')
        );

        onSnapshot(q, (snapshot) => {
            tasksList.innerHTML = '';
            deferredTasksList.innerHTML = '';
            completedTasksList.innerHTML = '';

            const allTasks = [];
            snapshot.forEach(doc => allTasks.push({ id: doc.id, ...doc.data() }));

            // Сортуємо: активні, відкладені, завершені. Всередині групи - за пріоритетом/датою.
            allTasks.sort((a, b) => {
                // Completed завжди в кінці
                if (a.isCompleted !== b.isCompleted) {
                    return a.isCompleted ? 1 : -1;
                }
                // Deferred після Active
                if (a.status !== b.status) {
                    if (a.status === 'active' && b.status === 'deferred') return -1;
                    if (a.status === 'deferred' && b.status === 'active') return 1;
                }

                // Внутрішнє сортування: пріоритет (високий > середній > низький)
                const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });

            allTasks.forEach(renderTask);

            // Оновлення тексту кнопок
            getEl('deferred-count').textContent = `(${deferredTasksList.children.length})`;
            getEl('completed-count').textContent = `(${completedTasksList.children.length})`;
        });

        loadExpansionState();
    }

    function openViewEditModal(task) {
        currentTaskForAction = task;
        editTaskTitle.value = task.text || '';
        editTaskNotes.value = task.notes || '';
        editTaskDueDate.value = task.dueDate || '';
        editTaskReminderDate.value = task.reminderDate || '';
        editTaskStatus.value = task.status || 'active';
        editTaskPriority.value = task.priority || 'medium';
        viewEditTaskModal.classList.remove('hidden');
    }

    function saveEditedTask() {
        if (!currentTaskForAction || !userId) return;

        const updatedData = {
            text: editTaskTitle.value.trim(),
            notes: editTaskNotes.value.trim(),
            dueDate: editTaskDueDate.value || null,
            reminderDate: editTaskReminderDate.value || null,
            status: editTaskStatus.value,
            priority: editTaskPriority.value
        };

        updateTask(currentTaskForAction.id, updatedData);
        hideViewEditModal();
    }

    function showTaskActionsModal(task, e) {
        currentTaskForAction = task;
        const isDeferred = task.status === 'deferred';

        actionDeferBtn.classList.toggle('hidden', isDeferred || task.isCompleted);
        actionActivateBtn.classList.toggle('hidden', !isDeferred || task.isCompleted);
        actionProlongBtn.classList.toggle('hidden', task.isCompleted);
        actionDeleteBtn.classList.toggle('hidden', false);

        taskActionsModal.classList.remove('hidden');

        // Позиціонування модального вікна біля кнопки
        const rect = e.target.getBoundingClientRect();
        taskActionsModal.style.top = `${rect.bottom + 5}px`;
        taskActionsModal.style.left = `${rect.left - taskActionsModal.offsetWidth + rect.width}px`;
    }

    function updateTaskStatus(taskId, newStatus, sharedTaskId) {
        if (!userId) return;
        updateTask(taskId, { status: newStatus });
        if (sharedTaskId) {
            updateSharedTaskStatus(sharedTaskId, newStatus === 'deferred' ? 'deferred' : 'active');
        }
    }

    function prolongTask(taskId) {
        if (!userId) return;
        // Продовження на 7 днів
        const date = new Date();
        date.setDate(date.getDate() + 7);
        const newDueDate = date.toISOString().split('T')[0];
        updateTask(taskId, { dueDate: newDueDate });
    }

    // --- ФУНКЦІЇ НАЛАШТУВАНЬ ---

    async function saveSettings() {
        if (!userId) return;
        const timezone = settingsTimezone.value;

        try {
            await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'profile', 'settings'), {
                timezone: timezone,
                lastUpdated: serverTimestamp()
            });
            showNotification('Успіх', 'Налаштування збережено.');
        } catch (e) {
            console.error("Помилка збереження налаштувань:", e);
        }
    }

    async function loadSettings() {
        if (!userId) return;
        try {
            const docSnap = await getDoc(doc(db, 'artifacts', appId, 'users', userId, 'profile', 'settings'));
            if (docSnap.exists()) {
                const settings = docSnap.data();
                settingsTimezone.value = settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            } else {
                settingsTimezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
            }
        } catch (e) {
            console.error("Помилка завантаження налаштувань:", e);
        }
    }

    // --- ФУНКЦІЇ СПОВІЩЕНЬ ---

    function requestNotificationPermission() {
        if (!("Notification" in window)) {
            showNotification('Помилка', 'Цей браузер не підтримує сповіщення.');
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                showNotification('Успіх', 'Сповіщення дозволено!');
            } else {
                showNotification('Попередження', 'Сповіщення заблоковано. Ви не будете отримувати нагадування.');
            }
        });
    }

    function checkNotificationStatus() {
        if ("Notification" in window && Notification.permission === "granted") {
            enableNotificationsBtn.textContent = "Сповіщення дозволені";
            enableNotificationsBtn.disabled = true;
        } else {
            enableNotificationsBtn.textContent = "Увімкнути сповіщення";
            enableNotificationsBtn.disabled = false;
        }
    }

    // --- ФУНКЦІЇ ДРУЗІВ ---

    async function saveFriend() {
        const friendEmail = friendEmailInput.value.trim();
        if (!friendEmail || !userId) return;

        try {
            const usersRef = collection(db, 'artifacts', appId, 'users');
            const q = query(usersRef, where('profile.email', '==', friendEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                showNotification('Помилка', `Користувача з email ${friendEmail} не знайдено.`);
                return;
            }

            const friendDoc = querySnapshot.docs[0];
            const friendId = friendDoc.id;

            if (friendId === userId) {
                showNotification('Помилка', 'Ви не можете додати себе в друзі.');
                return;
            }

            // Додавання друга
            await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'friends', friendId), {
                email: friendEmail,
                addedAt: serverTimestamp()
            });

            showNotification('Успіх', `Користувача ${friendEmail} додано в друзі.`);
            hideAddFriendModal();

        } catch (e) {
            console.error("Помилка додавання друга:", e);
        }
    }

    function subscribeToFriends() {
        if (!userId) return;
        const q = query(
            collection(db, 'artifacts', appId, 'users', userId, 'friends'),
            orderBy('email', 'asc')
        );

        onSnapshot(q, async (snapshot) => {
            friendsList.innerHTML = '';
            assignFriendSelect.innerHTML = '<option value="">Виберіть друга</option>';
            boardFriendSelect.innerHTML = '<option value="">Виберіть друга</option>';
            friendsChatList.innerHTML = '';
            const friendPromises = [];

            snapshot.forEach(doc => {
                const friendId = doc.id;
                const friendData = doc.data();
                friendPromises.push(
                    getDoc(doc(db, 'artifacts', appId, 'users', friendId, 'profile', 'settings'))
                        .then(profileSnap => {
                            const friendEmail = profileSnap.data()?.email || friendData.email;
                            return { id: friendId, email: friendEmail };
                        })
                );
            });

            const friends = await Promise.all(friendPromises);

            friends.forEach(friend => {
                // Рендеринг списку друзів
                const friendEl = document.createElement('div');
                friendEl.className = 'flex justify-between items-center p-2 hover:bg-gray-50 rounded';
                friendEl.innerHTML = `
                    <span>${friend.email} (${friend.id.substring(0, 8)}...)</span>
                    <div class="flex space-x-2">
                        <button class="text-blue-500 hover:text-blue-700 chat-friend-btn" data-friend-id="${friend.id}" data-friend-email="${friend.email}" title="Чат"><i class="fas fa-comment"></i></button>
                    </div>
                `;
                friendsList.appendChild(friendEl);
                
                // Рендеринг для вибору
                assignFriendSelect.innerHTML += `<option value="${friend.id}">${friend.email} (${friend.id.substring(0, 4)}...)</option>`;
                boardFriendSelect.innerHTML += `<option value="${friend.id}">${friend.email} (${friend.id.substring(0, 4)}...)</option>`;

                // Рендеринг для чату
                const chatEl = document.createElement('div');
                chatEl.className = 'friend-chat-item p-3 border-b cursor-pointer hover:bg-indigo-50 transition-colors';
                chatEl.dataset.friendId = friend.id;
                chatEl.dataset.friendEmail = friend.email;
                chatEl.innerHTML = `
                    <p class="font-semibold">${friend.email}</p>
                    <span class="text-xs text-gray-500 unread-count-badge" id="unread-count-${friend.id}"></span>
                `;
                friendsChatList.appendChild(chatEl);
            });

            document.querySelectorAll('.chat-friend-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.friendId;
                    const email = e.currentTarget.dataset.friendEmail;
                    openChatBox(id, email);
                });
            });

            document.querySelectorAll('.friend-chat-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.friendId;
                    const email = e.currentTarget.dataset.friendEmail;
                    openChatBox(id, email);
                });
            });
        });
    }

    // --- ФУНКЦІЇ ДІЙ З ЗАВДАННЯМИ ДРУЗІВ ---

    async function sendAssignedTask() {
        const text = assignTaskTitle.value.trim();
        const recipientId = assignFriendSelect.value;
        if (!text || !recipientId || !userId) return;

        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shared_tasks'), {
                text,
                senderId: userId,
                recipientId: recipientId,
                status: 'pending',
                sentAt: serverTimestamp()
            });

            showNotification('Успіх', 'Завдання надіслано другу.');
            hideAssignTaskModal();
            assignTaskTitle.value = '';
            assignFriendSelect.value = '';

        } catch (e) {
            console.error("Помилка надсилання завдання:", e);
        }
    }

    function subscribeToIncomingTasks() {
        if (!userId) return;
        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'shared_tasks'),
            where('recipientId', '==', userId),
            where('status', 'in', ['pending', 'deferred', 'active'])
        );

        onSnapshot(q, (snapshot) => {
            incomingTasksList.innerHTML = '';
            const pendingTasks = [];

            snapshot.forEach(doc => {
                const task = { id: doc.id, ...doc.data() };
                if (task.status === 'pending') {
                    pendingTasks.push(task);
                    renderIncomingTask(task);
                }
            });

            incomingTasksCount.textContent = pendingTasks.length;
            incomingTasksCount.classList.toggle('bg-red-500', pendingTasks.length > 0);
        });
    }

    async function renderIncomingTask(task) {
        const senderSnap = await getDoc(doc(db, 'artifacts', appId, 'users', task.senderId, 'profile', 'settings'));
        const senderEmail = senderSnap.data()?.email || task.senderId.substring(0, 8) + '...';

        const el = document.createElement('div');
        el.className = 'p-3 mb-2 rounded shadow-sm bg-blue-100 cursor-pointer hover:shadow-md';
        el.innerHTML = `
            <p class="font-semibold">${task.text}</p>
            <p class="text-xs text-gray-600">Від: ${senderEmail}</p>
        `;

        el.addEventListener('click', () => {
            currentIncomingTask = task;
            incomingTaskTitle.textContent = task.text;
            incomingTaskDetails.innerHTML = `Надіслано користувачем: ${senderEmail}`;
            viewIncomingTaskModal.classList.remove('hidden');
        });

        incomingTasksList.appendChild(el);
    }

    async function acceptIncomingTask(task) {
        if (!userId) return;

        const batch = writeBatch(db);

        // 1. Додавання завдання до власних
        const userTaskRef = doc(collection(db, 'artifacts', appId, 'users', userId, 'tasks'));
        batch.set(userTaskRef, {
            text: task.text,
            status: 'active',
            isCompleted: false,
            createdAt: serverTimestamp(),
            originalSharedTaskId: task.id, // Посилання на оригінальне завдання
            ownerId: userId
        });

        // 2. Оновлення статусу спільного завдання
        const sharedTaskRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_tasks', task.id);
        batch.update(sharedTaskRef, { status: 'accepted', acceptedAt: serverTimestamp() });

        try {
            await batch.commit();
            showNotification('Успіх', 'Завдання прийнято та додано до ваших справ.');
        } catch (e) {
            console.error("Помилка прийняття завдання:", e);
        }
    }

    function updateSharedTaskStatus(sharedTaskId, newStatus) {
        if (!userId) return;
        const sharedTaskRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_tasks', sharedTaskId);
        updateDoc(sharedTaskRef, { status: newStatus }).catch(e => console.error("Помилка оновлення статусу спільного завдання:", e));
    }

    // --- ФУНКЦІЇ ЧАТУ ---

    function openChatView() {
        mainContent.classList.add('hidden');
        chatSection.classList.remove('hidden');
    }

    function closeChatView() {
        chatSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        selectedFriendForChat = null;
        chatBox.classList.add('hidden');
    }

    async function openChatBox(friendId, friendEmail) {
        selectedFriendForChat = friendId;
        chatHeader.textContent = `Чат з ${friendEmail}`;
        chatBox.classList.remove('hidden');
        chatMessages.innerHTML = '';

        // Очистити лічильник непрочитаних
        const unreadBadge = getEl(`unread-count-${friendId}`);
        if (unreadBadge) unreadBadge.textContent = '';

        subscribeToChat(friendId);
    }

    function getChatId(user1, user2) {
        return user1 < user2 ? `${user1}_${user2}` : `${user2}_${user1}`;
    }

    function subscribeToChat(friendId) {
        if (!userId || !friendId) return;
        const chatId = getChatId(userId, friendId);

        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'chats', chatId, 'messages'),
            orderBy('sentAt', 'asc')
        );

        onSnapshot(q, async (snapshot) => {
            chatMessages.innerHTML = '';
            const messages = [];
            const batch = writeBatch(db);

            snapshot.forEach(doc => {
                const message = { id: doc.id, ...doc.data() };
                messages.push(message);

                // Позначити як прочитане, якщо не відправник
                if (message.recipientId === userId && !message.isRead) {
                    batch.update(doc.ref, { isRead: true, readAt: serverTimestamp() });
                }
            });

            // Застосувати зміни для оновлення статусу "прочитано"
            await batch.commit().catch(e => console.error("Помилка оновлення статусу прочитання:", e));

            messages.forEach(renderChatMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Прокрутка до останнього
        });
    }

    async function sendChatMessage({ text, imageUrl, recipient }) {
        if (!userId || !recipient) return;
        const chatId = getChatId(userId, recipient);
        const messageText = text || '🖼️ Зображення';

        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats', chatId, 'messages'), {
                senderId: userId,
                recipientId: recipient,
                text: messageText,
                imageUrl: imageUrl || null,
                isRead: false,
                sentAt: serverTimestamp()
            });
            chatMessageInput.value = '';
        } catch (e) {
            console.error("Помилка надсилання повідомлення:", e);
        }
    }

    function renderChatMessage(message) {
        const isSender = message.senderId === userId;
        const el = document.createElement('div');
        el.className = `flex ${isSender ? 'justify-end' : 'justify-start'} mb-3`;

        let content;
        if (message.imageUrl) {
            content = `
                <img src="${message.imageUrl}" class="max-w-xs max-h-48 object-cover rounded cursor-pointer" onclick="showImageViewer('${message.imageUrl}')">
            `;
        } else {
            content = `<p class="text-sm">${message.text}</p>`;
        }

        const readStatus = isSender && message.isRead ? '<i class="fas fa-check-double text-blue-400 text-xs ml-1"></i>' : (isSender ? '<i class="fas fa-check text-gray-400 text-xs ml-1"></i>' : '');
        const time = message.sentAt ? new Date(message.sentAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        el.innerHTML = `
            <div class="max-w-3/4 p-3 rounded-xl shadow-md relative ${isSender ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}">
                ${content}
                <div class="text-right text-xs mt-1 flex items-center justify-end ${isSender ? 'text-indigo-200' : 'text-gray-500'}">
                    <span>${time}</span>
                    ${readStatus}
                </div>
            </div>
        `;
        chatMessages.appendChild(el);
    }

    window.showImageViewer = function (imageUrl) {
        imageViewerContent.innerHTML = `<img src="${imageUrl}" class="max-w-full max-h-full object-contain">`;
        imageViewerModal.classList.remove('hidden');
    };

    async function uploadImageAndSendMessage(file) {
        if (!userId || !selectedFriendForChat) {
            showNotification('Помилка', 'Виберіть друга для надсилання файлу.');
            return;
        }

        const storageRef = ref(storage, `chat_images/${userId}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                console.error("Помилка завантаження зображення:", error);
                showNotification('Помилка', 'Не вдалося завантажити зображення.');
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    sendChatMessage({ imageUrl: downloadURL, recipient: selectedFriendForChat });
                });
            }
        );
    }

    function subscribeToUnreadCounts() {
        if (!userId) return;

        // Потрібно знайти всі чати, де поточний користувач є або відправником, або отримувачем.
        // Оскільки ми не можемо використовувати "where" для поля "messages" у підколекції,
        // ми підписуємось на всіх друзів і перевіряємо їхні чати.

        const friendsRef = collection(db, 'artifacts', appId, 'users', userId, 'friends');
        onSnapshot(friendsRef, (snapshot) => {
            snapshot.forEach(doc => {
                const friendId = doc.id;
                const chatId = getChatId(userId, friendId);

                const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats', chatId, 'messages');
                const q = query(messagesRef, where('recipientId', '==', userId), where('isRead', '==', false));

                onSnapshot(q, (messagesSnapshot) => {
                    const unreadCount = messagesSnapshot.size;
                    const badge = getEl(`unread-count-${friendId}`);
                    if (badge) {
                        badge.textContent = unreadCount > 0 ? `(${unreadCount} нових)` : '';
                    }
                });
            });
        });
    }

    // --- ФУНКЦІЇ ЗВІТІВ ---

    function openReportView() {
        mainContent.classList.add('hidden');
        reportSection.classList.remove('hidden');
        subscribeToSharedTasksReport();
    }

    function closeReportView() {
        reportSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
    }

    function subscribeToSharedTasksReport() {
        if (!userId) return;
        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'shared_tasks'),
            where('senderId', '==', userId),
            orderBy('sentAt', 'desc')
        );

        onSnapshot(q, (snapshot) => {
            reportTableBody.innerHTML = '';
            snapshot.forEach(doc => renderReportRow({ id: doc.id, ...doc.data() }));
        });
    }

    async function renderReportRow(task) {
        const recipientSnap = await getDoc(doc(db, 'artifacts', appId, 'users', task.recipientId, 'profile', 'settings'));
        const recipientEmail = recipientSnap.data()?.email || task.recipientId.substring(0, 8) + '...';

        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50 cursor-pointer report-task-card';
        row.dataset.taskText = task.text;
        row.dataset.taskId = task.id;

        const statusMap = {
            'pending': 'Очікує',
            'accepted': 'Прийнято',
            'declined': 'Відхилено',
            'completed': 'Виконано',
            'deferred': 'Відкладено',
            'active': 'Активно'
        };

        const statusClass = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'accepted': 'bg-blue-100 text-blue-800',
            'declined': 'bg-red-100 text-red-800',
            'completed': 'bg-green-100 text-green-800',
            'deferred': 'bg-gray-100 text-gray-800',
            'active': 'bg-indigo-100 text-indigo-800'
        };

        row.innerHTML = `
            <td class="p-3 text-sm font-medium">${task.text}</td>
            <td class="p-3 text-sm">${recipientEmail}</td>
            <td class="p-3 text-sm">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass[task.status] || 'bg-gray-100 text-gray-800'}">
                    ${statusMap[task.status] || task.status}
                </span>
            </td>
            <td class="p-3 text-sm">${task.sentAt ? new Date(task.sentAt.toDate()).toLocaleDateString() : 'N/A'}</td>
        `;
        reportTableBody.appendChild(row);
    }

    function showTaskDetailsModal(taskText, taskId) {
        taskDetailsText.textContent = taskText;
        taskDetailsStatus.textContent = taskId; // Temporarily store ID
        deleteFromReportBtn.dataset.taskId = taskId;
        taskDetailsModal.classList.remove('hidden');
    }

    function deleteSharedTaskFromReport() {
        const taskId = deleteFromReportBtn.dataset.taskId;
        if (!taskId) return;
        deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shared_tasks', taskId))
            .then(() => showNotification('Успіх', 'Запис видалено зі звіту.'))
            .catch(e => console.error("Помилка видалення зі звіту:", e));
        hideTaskDetailsModal();
    }

    // --- ФУНКЦІЇ РЕСУРСІВ ---

    function openResourcesView() {
        mainContent.classList.add('hidden');
        resourcesSection.classList.remove('hidden');
        subscribeToShelves();
    }

    function closeResourcesView() {
        resourcesSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
    }

    function subscribeToShelves() {
        if (!userId) return;
        const q = query(
            collection(db, 'artifacts', appId, 'users', userId, 'shelves'),
            orderBy('name', 'asc')
        );

        onSnapshot(q, (snapshot) => {
            shelvesList.innerHTML = '';
            resourceShelfSelect.innerHTML = '<option value="">Виберіть полицю</option>';
            snapshot.forEach(doc => {
                renderShelf({ id: doc.id, ...doc.data() });
                resourceShelfSelect.innerHTML += `<option value="${doc.id}">${doc.data().name}</option>`;
            });
            subscribeToResources();
        });
    }

    function renderShelf(shelf) {
        const el = document.createElement('li');
        el.className = 'p-3 mb-2 rounded shadow-sm bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors flex justify-between items-center';
        el.innerHTML = `
            <span class="font-semibold">${shelf.name}</span>
            <button class="text-red-500 hover:text-red-700 delete-shelf-btn" data-id="${shelf.id}"><i class="fas fa-trash-alt"></i></button>
        `;
        el.querySelector('.delete-shelf-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirmModal(() => deleteShelf(shelf.id), `Видалити полицю "${shelf.name}"?`, "Видалити");
        });

        el.addEventListener('click', () => {
            filterAndRenderResources(shelf.id);
        });

        shelvesList.appendChild(el);
    }

    function addShelf() {
        const name = shelfNameInput.value.trim();
        if (!name || !userId) return;
        addDoc(collection(db, 'artifacts', appId, 'users', userId, 'shelves'), {
            name,
            createdAt: serverTimestamp()
        }).then(() => {
            addShelfModal.classList.add('hidden');
            shelfNameInput.value = '';
            showNotification('Успіх', 'Полицю додано.');
        }).catch(e => console.error("Помилка додавання полиці:", e));
    }

    function deleteShelf(shelfId) {
        if (!userId) return;
        deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'shelves', shelfId))
            .catch(e => console.error("Помилка видалення полиці:", e));
    }

    // --- ФУНКЦІЇ РЕСУРСІВ ---

    let allResources = [];

    function subscribeToResources() {
        if (!userId) return;
        const q = query(
            collection(db, 'artifacts', appId, 'users', userId, 'resources'),
            orderBy('title', 'asc')
        );

        onSnapshot(q, (snapshot) => {
            allResources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            filterAndRenderResources();
        });
    }

    function filterAndRenderResources(shelfId = null, searchTerm = resourcesSearchInput.value.trim()) {
        resourcesContainer.innerHTML = '';
        let filtered = allResources;

        if (shelfId) {
            filtered = filtered.filter(r => r.shelfId === shelfId);
        }

        if (searchTerm) {
            filtered = filtered.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (filtered.length === 0) {
            resourcesContainer.innerHTML = '<p class="text-center text-gray-500 mt-4">Ресурси не знайдено.</p>';
            return;
        }

        filtered.forEach(renderResource);
    }

    function renderResource(resource) {
        const el = document.createElement('div');
        el.className = 'p-3 mb-2 rounded shadow-sm bg-white border hover:shadow-md transition-shadow flex justify-between items-center';
        el.innerHTML = `
            <div>
                <a href="${resource.link}" target="_blank" class="font-semibold text-blue-600 hover:underline">${resource.title}</a>
                <p class="text-xs text-gray-500">Полиця: ${resource.shelfName || 'N/A'}</p>
            </div>
            <button class="text-red-500 hover:text-red-700 delete-resource-btn" data-id="${resource.id}"><i class="fas fa-trash-alt"></i></button>
        `;
        el.querySelector('.delete-resource-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirmModal(() => deleteResource(resource.id), `Видалити ресурс "${resource.title}"?`, "Видалити");
        });
        resourcesContainer.appendChild(el);
    }

    function addResource() {
        const title = resourceTitleInput.value.trim();
        const link = resourceLinkInput.value.trim();
        const shelfId = resourceShelfSelect.value;
        const shelfName = resourceShelfSelect.options[resourceShelfSelect.selectedIndex].text;

        if (!title || !link || !shelfId || !userId) return;

        addDoc(collection(db, 'artifacts', appId, 'users', userId, 'resources'), {
            title,
            link,
            shelfId,
            shelfName,
            createdAt: serverTimestamp()
        }).then(() => {
            addResourceModal.classList.add('hidden');
            resourceTitleInput.value = '';
            resourceLinkInput.value = '';
            showNotification('Успіх', 'Ресурс додано.');
        }).catch(e => console.error("Помилка додавання ресурсу:", e));
    }

    function deleteResource(resourceId) {
        if (!userId) return;
        deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'resources', resourceId))
            .catch(e => console.error("Помилка видалення ресурсу:", e));
    }

    // --- ФУНКЦІЇ ДОШОК (Boards) ---

    const getBoardStatusTag = (statusKey) => {
        const status = BOARD_STATUSES[statusKey] || BOARD_STATUSES.New;
        return `<span class="board-status-tag text-xs font-semibold px-2 py-0.5 rounded-full ${status.color} ${status.text} absolute top-1 right-1/2 translate-x-1/2">${status.title}</span>`;
    };

    function switchMobileTab(tab) {
        if (tab === 'tasks') {
            boardTasksColumn.classList.remove('hidden');
            boardStickersColumn.classList.add('hidden');
            mobileTabTasks.classList.add('border-indigo-500', 'text-indigo-600');
            mobileTabStickers.classList.remove('border-indigo-500', 'text-indigo-600');
        } else {
            boardTasksColumn.classList.add('hidden');
            boardStickersColumn.classList.remove('hidden');
            mobileTabTasks.classList.remove('border-indigo-500', 'text-indigo-600');
            mobileTabStickers.classList.add('border-indigo-500', 'text-indigo-600');
        }
    }

    const renderBoardTask = (item) => {
        const total = item.subtasks ? item.subtasks.length : 0;
        const done = item.subtasks ? item.subtasks.filter(s => s.completed).length : 0;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        const isCompleted = item.isCompleted === true; // Нове поле

        const el = document.createElement('div');
        // Додаємо клас для completed-task-card та змінюємо border/background
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

    // --- Єдина та виправлена функція toggleSubtask_withLogging (Виправлення Cannot redeclare) ---
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
    
    // Інші функції дощок
    
    const renderSticker = (sticker) => {
        const el = document.createElement('div');
        el.className = `p-3 rounded shadow-md border cursor-pointer hover:shadow-lg transition-all relative sticker-${sticker.color}`;
        el.innerHTML = `
            <div class="flex justify-end">
                <button class="text-gray-400 hover:text-red-600 delete-sticker-btn" data-id="${sticker.id}"><i class="fas fa-trash-alt"></i></button>
            </div>
            <p class="text-gray-800 break-words mt-1">${sticker.text}</p>
        `;
        el.querySelector('.delete-sticker-btn').addEventListener('click', () => deleteSticker_withLogging(sticker.id));
        boardStickersArea.appendChild(el);
    };

    async function addBoardTask_withLogging() {
        if (!currentBoardId || !userId) return;
        const text = boardTaskTitle.value.trim();
        const subtaskInputs = subtasksContainer.querySelectorAll('.subtask-input');
        const subtasks = Array.from(subtaskInputs)
            .map(input => input.value.trim())
            .filter(v => v)
            .map(v => ({ text: v, completed: false }));

        if (!text) return;

        try {
            const newItemRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'board_items'), {
                boardId: currentBoardId,
                type: 'task',
                text,
                subtasks,
                isCompleted: false, // Нове поле
                ownerId: userId,
                createdAt: serverTimestamp()
            });

            await logBoardActivity(currentBoardId, {
                type: 'task_added',
                itemId: newItemRef.id,
                taskText: text
            });

            addBoardTaskModal.classList.add('hidden');
        } catch (e) { console.error("Error adding board task", e); }
    }

    function openEditBoardTask(item) {
        editingBoardTask = item;
        boardTaskTitle.value = item.text || '';
        subtasksContainer.innerHTML = '';
        if (item.subtasks && item.subtasks.length > 0) {
            item.subtasks.forEach(s => {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = s.text;
                input.placeholder = `Крок`;
                input.className = 'subtask-input w-full px-3 py-1.5 rounded border border-gray-200 text-sm mb-1';
                subtasksContainer.appendChild(input);
            });
        } else {
            subtasksContainer.innerHTML = '<input type="text" placeholder="Крок 1" class="subtask-input w-full px-3 py-1.5 rounded border border-gray-200 text-sm">';
        }

        addBoardTaskModal.classList.remove('hidden');

        // Змінюємо обробник для збереження
        saveBoardTaskBtn.removeEventListener('click', addBoardTask_withLogging);
        saveBoardTaskBtn.addEventListener('click', saveEditedBoardTask_withLogging);
        cancelBoardTaskBtn.addEventListener('click', () => {
            addBoardTaskModal.classList.add('hidden');
            // Відновлюємо оригінальний обробник
            saveBoardTaskBtn.removeEventListener('click', saveEditedBoardTask_withLogging);
            saveBoardTaskBtn.addEventListener('click', addBoardTask_withLogging);
        });
    }

    async function saveEditedBoardTask_withLogging() {
        if (!editingBoardTask || !userId) return;
        const newText = boardTaskTitle.value.trim();
        const subtaskInputs = subtasksContainer.querySelectorAll('.subtask-input');
        const newSubtasks = Array.from(subtaskInputs)
            .map(input => input.value.trim())
            .filter(v => v)
            .map((v, idx) => ({ 
                text: v, 
                completed: editingBoardTask.subtasks?.[idx]?.completed || false 
            })); // Зберігаємо статус completed

        if (!newText) return;
        
        // Перевіряємо, чи всі підзавдання виконані
        const allCompleted = newSubtasks.length > 0 && newSubtasks.every(s => s.completed);

        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'board_items', editingBoardTask.id), {
                text: newText,
                subtasks: newSubtasks,
                isCompleted: allCompleted,
                updatedAt: serverTimestamp()
            });

            await logBoardActivity(editingBoardTask.boardId, {
                type: 'task_edited',
                itemId: editingBoardTask.id,
                oldText: editingBoardTask.text,
                newText: newText
            });

            addBoardTaskModal.classList.add('hidden');
        } catch (e) { console.error("Error saving edited board task", e); }
        
        // Відновлюємо оригінальний обробник
        saveBoardTaskBtn.removeEventListener('click', saveEditedBoardTask_withLogging);
        saveBoardTaskBtn.addEventListener('click', addBoardTask_withLogging);
        editingBoardTask = null;
    }

    async function deleteBoardItem_withLogging(itemId) {
        if (!currentBoardId || !userId) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'board_items', itemId));

            await logBoardActivity(currentBoardId, {
                type: 'item_deleted',
                itemId: itemId
            });

            showNotification('Успіх', 'Елемент дошки видалено.');
        } catch (e) { console.error("Error deleting board item", e); }
    }

    async function addSticker_withLogging() {
        if (!currentBoardId || !userId) return;
        const text = stickerTextInput.value.trim();
        const color = selectedStickerColor;

        if (!text) return;

        try {
            const newItemRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'board_items'), {
                boardId: currentBoardId,
                type: 'sticker',
                text,
                color,
                ownerId: userId,
                createdAt: serverTimestamp()
            });

            await logBoardActivity(currentBoardId, {
                type: 'sticker_added',
                itemId: newItemRef.id,
                stickerText: text
            });

            addStickerModal.classList.add('hidden');
        } catch (e) { console.error("Error adding sticker", e); }
    }

    async function deleteSticker_withLogging(stickerId) {
        if (!currentBoardId || !userId) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'board_items', stickerId));

            await logBoardActivity(currentBoardId, {
                type: 'item_deleted',
                itemId: stickerId
            });
        } catch (e) { console.error("Error deleting sticker", e); }
    }

    function subscribeToBoardItems(boardId) {
        if (!boardId) return;

        if(unsubscribeFromBoardItems) unsubscribeFromBoardItems();
        
        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'board_items'),
            where('boardId', '==', boardId),
            orderBy('createdAt', 'desc')
        );

        unsubscribeFromBoardItems = onSnapshot(q, (snapshot) => {
            boardTasksList.innerHTML = '';
            boardStickersArea.innerHTML = '';
            
            snapshot.forEach(doc => {
                const item = { id: doc.id, ...doc.data() };
                if (item.type === 'task') {
                    renderBoardTask(item);
                } else if (item.type === 'sticker') {
                    renderSticker(item);
                }
            });
        });
    }

    function subscribeToBoardActivities(boardId) {
        if (!boardId) return;

        if(unsubscribeFromBoardActivities) unsubscribeFromBoardActivities();
        
        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'board_activities'),
            where('boardId', '==', boardId),
            orderBy('timestamp', 'desc')
        );

        unsubscribeFromBoardActivities = onSnapshot(q, (snapshot) => {
            latestBoardActivities = snapshot.docs.slice(0, 50).map(d => d.data());
            // Тут може бути функція для рендерингу активності, якщо вона потрібна
        });
    }

    async function logBoardActivity(boardId, activity) {
        if (!userId) return;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'board_activities'), {
                boardId,
                userId,
                timestamp: serverTimestamp(),
                ...activity
            });
        } catch (e) { console.error("Error logging board activity", e); }
    }

    function openActiveBoard(board) {
        currentBoardId = board.id;
        activeBoardTitle.textContent = board.title;
        
        boardsListView.classList.add('hidden');
        activeBoardView.classList.remove('hidden');
        activeBoardView.classList.add('flex');
        
        switchMobileTab('tasks');
        
        subscribeToBoardItems(board.id);
        subscribeToBoardActivities(board.id);
    }

    const subscribeToBoards = () => {
        if(!userId) return;
        // Сортуємо: Completed дошки йдуть в кінець (status ASC)
        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'boards'), 
            where('members', 'array-contains', userId)
        );
        unsubscribeFromBoards = onSnapshot(q, (snapshot) => {
            boardsGrid.innerHTML = '';
            // Сортуємо на клієнті, щоб Completed були в кінці
            const sortedBoards = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
                const statusA = a.status || 'New';
                const statusB = b.status || 'New';
                if (statusA === 'Completed' && statusB !== 'Completed') return 1;
                if (statusA !== 'Completed' && statusB === 'Completed') return -1;
                return 0;
            });
            
            if(sortedBoards.length === 0) {
                boardsGrid.innerHTML = `<p class="text-center col-span-3 text-gray-500">Ви ще не маєте спільних дошок.</p>`;
                return;
            }
            
            sortedBoards.forEach(board => {
                const isOwner = board.ownerId === userId;
                const status = board.status || 'New';
                const isCompleted = status === 'Completed';

                const el = document.createElement('div');
                // Додаємо клас для completed дощок
                el.className = `bg-white p-6 rounded-xl shadow-lg border cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 relative group ${isCompleted ? 'border-green-300 bg-green-50' : 'border-orange-100'}`;

                const deleteBtnHtml = isOwner 
                    ? `<button class="delete-board-btn absolute top-2 right-2 text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${board.id}" title="Видалити дошку"><i class="fas fa-trash-alt"></i></button>`
                    : '';

                const editBtnHtml = isOwner
                    ? `<button class="edit-board-btn absolute top-2 left-2 text-gray-300 hover:text-blue-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${board.id}" title="Редагувати назву та статус"><i class="fas fa-edit"></i></button>`
                    : '';
                
                const statusTagHtml = getBoardStatusTag(status);
                
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
    
    function deleteBoard(boardId) {
        if (!userId) return;
        deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'boards', boardId))
            .then(() => showNotification('Успіх', 'Дошку видалено.'))
            .catch(e => console.error("Помилка видалення дошки:", e));
    }

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
    
    function openEditBoardModal(board) {
        editingBoard = board; 
        
        editBoardTitleInput.value = board.title;
        
        // Логіка статусу
        editBoardStatusSelect.innerHTML = Object.keys(BOARD_STATUSES).map(key => 
            `<option value="${key}" ${board.status === key ? 'selected' : ''}>${BOARD_STATUSES[key].title}</option>`
        ).join('');
        
        editBoardModal.classList.remove("hidden"); 
    }

    function cancelEditBoard() {
        editBoardModal.classList.add("hidden"); 
        editingBoard = null;
    }

    async function saveEditedBoard() {
        if (!editingBoard) return;

        const newTitle = editBoardTitleInput.value.trim();
        const newStatus = editBoardStatusSelect.value;
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
                activeBoardTitle.textContent = newTitle;
            }

            cancelEditBoard();
            showNotification('Успіх', 'Дошку оновлено.');

        } catch (e) {
            console.error("Помилка оновлення назви дошки:", e);
        }
    }
    
    async function addBoardMember() {
        if (!currentBoardId || !userId) return;
        const friendId = boardFriendSelect.value;
        if (!friendId) return;

        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'boards', currentBoardId), {
                members: arrayUnion(friendId)
            });

            await logBoardActivity(currentBoardId, {
                type: 'member_added',
                newMemberId: friendId
            });

            addBoardMemberModal.classList.add('hidden');
            boardFriendSelect.value = '';
            showNotification('Успіх', 'Учасника додано до дошки.');

        } catch (e) {
            console.error("Error adding board member", e);
        }
    }


    // --- ОБРОБНИКИ ПОДІЙ ---
    
    googleSignInButton.addEventListener('click', signInWithGoogle);
    signOutButton.addEventListener('click', signOutUser);
    addTaskButton.addEventListener('click', addTask);
    confirmDeleteButton.addEventListener('click', () => { if (currentAction) currentAction(); hideConfirmModal(); });
    cancelDeleteButton.addEventListener('click', hideConfirmModal);
    closeNotificationBtn.addEventListener('click', hideNotification);
    saveEditBtn.addEventListener('click', saveEditedTask);
    cancelEditBtn.addEventListener('click', hideViewEditModal);
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    const toggleSection = (listEl, btnEl, initialLoad = false) => { 
        if (!initialLoad) {
            listEl.classList.toggle('hidden'); 
            btnEl.textContent = listEl.classList.contains('hidden') ? 'Розгорнути' : 'Згорнути'; 
            saveExpansionState(); 
        } else {
             btnEl.textContent = listEl.classList.contains('hidden') ? 'Розгорнути' : 'Згорнути'; 
        }
    };
    
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

    // --- ОБРОБНИКИ ДОШОК ---
    boardsBtn.addEventListener('click', () => { mainContent.classList.add('hidden'); boardsSection.classList.remove('hidden'); subscribeToBoards(); });
    backToTasksFromBoardsBtn.addEventListener('click', () => { 
        activeBoardView.classList.add('hidden'); 
        activeBoardView.classList.remove('flex'); 
        boardsListView.classList.add('hidden'); 
        boardsSection.classList.add('hidden'); 
        mainContent.classList.remove('hidden'); 
        if(unsubscribeFromBoards) unsubscribeFromBoards(); 
    });
    createBoardBtn.addEventListener('click', () => { boardNameInput.value = ''; createBoardModal.classList.remove('hidden'); });
    cancelBoardBtn.addEventListener('click', () => createBoardModal.classList.add('hidden'));
    saveBoardBtn.addEventListener('click', createBoard);
    backToBoardsListBtn.addEventListener('click', () => { 
        activeBoardView.classList.add('hidden'); 
        activeBoardView.classList.remove('flex'); 
        boardsListView.classList.remove('hidden'); 
        if(unsubscribeFromBoardItems) unsubscribeFromBoardItems(); 
        if(unsubscribeFromBoardActivities) unsubscribeFromBoardActivities();
        currentBoardId = null;
    });

    addBoardMemberBtn.addEventListener('click', () => addBoardMemberModal.classList.remove('hidden'));
    cancelBoardMemberBtn.addEventListener('click', () => addBoardMemberModal.classList.add('hidden'));
    saveBoardMemberBtn.addEventListener('click', addBoardMember);

    addBoardTaskBtn.addEventListener('click', () => {
        boardTaskTitle.value = '';
        subtasksContainer.innerHTML = '<input type="text" placeholder="Крок 1" class="subtask-input w-full px-3 py-1.5 rounded border border-gray-200 text-sm">';
        addBoardTaskModal.classList.remove('hidden');
        
        // Відновлюємо оригінальний обробник
        saveBoardTaskBtn.removeEventListener('click', saveEditedBoardTask_withLogging);
        saveBoardTaskBtn.addEventListener('click', addBoardTask_withLogging);
        cancelBoardTaskBtn.addEventListener('click', () => addBoardTaskModal.classList.add('hidden'));
    });
    
    // Нові обробники для редагування дошки
    saveEditBoardBtn.addEventListener('click', saveEditedBoard);
    cancelEditBoardBtn.addEventListener('click', cancelEditBoard);
    
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

    // --- ФІНАЛЬНА АУТЕНТИФІКАЦІЯ ---
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
            subscribeToBoards(); // Запускаємо підписку на дошки
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
};