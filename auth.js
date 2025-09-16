// **Supabase Initialization**
const SUPABASE_URL = 'https://bhqnwueocaobybbrinwf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocW53dWVvY2FvYnliYnJpbndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5ODA3MDAsImV4cCI6MjA3MzU1NjcwMH0.LQ9U5eblqrA4wCGXk1v3PHCmb1NPE7kdGJHeT1CmEhI';

// Initialize Supabase client
// The correct way is to use the global Supabase object, not a variable named 'supabase'
const supabaseClient = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// **Authentication Functions**
// Handle registration
const handleRegister = async (event) => {
    event.preventDefault();

    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('register-email');
    const usernameInput = document.getElementById('register-username');
    const phoneNumberInput = document.getElementById('phone-number');
    const passwordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const registerMessage = document.getElementById('register-message');
    const registerBtn = document.getElementById('register-btn');
    const registerBtnText = document.getElementById('register-btn-text');
    const registerBtnLoading = document.getElementById('register-btn-loading');

    const fullName = fullNameInput?.value;
    const email = emailInput?.value;
    let username = usernameInput?.value;
    const phoneNumber = phoneNumberInput?.value;
    const password = passwordInput?.value;
    const confirmPassword = confirmPasswordInput?.value;

    if (!registerMessage || !registerBtn || !registerBtnText || !registerBtnLoading) return;

    // Show loading state
    registerBtn.disabled = true;
    registerBtnText.classList.add('hidden');
    registerBtnLoading.classList.remove('hidden');
    registerMessage.classList.add('hidden');

    // Generate unique default username if none provided
    if (!username) {
        const randomId = Math.random().toString(36).substring(2, 8);
        username = `user_${randomId}`;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
        registerMessage.textContent = 'Error: Passwords do not match!';
        registerMessage.classList.remove('hidden');
        registerMessage.classList.add('text-red-500');
        // Hide loading and re-enable button
        registerBtn.disabled = false;
        registerBtnText.classList.remove('hidden');
        registerBtnLoading.classList.add('hidden');
        return;
    }

    // Validate password length
    if (password.length < 6) {
        registerMessage.textContent = 'Error: Password must be at least 6 characters!';
        registerMessage.classList.remove('hidden');
        registerMessage.classList.add('text-red-500');
        // Hide loading and re-enable button
        registerBtn.disabled = false;
        registerBtnText.classList.remove('hidden');
        registerBtnLoading.classList.add('hidden');
        return;
    }

    // Step 1: Register user with Supabase Authentication
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email,
        password,
    });

    if (authError) {
        registerMessage.textContent = `Error: ${authError.message}`;
        registerMessage.classList.remove('hidden');
        registerMessage.classList.add('text-red-500');
        registerBtn.disabled = false;
        registerBtnText.classList.remove('hidden');
        registerBtnLoading.classList.add('hidden');
        return;
    }

    // Step 2: Insert profile data into 'profiles' table
    const userId = authData.user.id;
    const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert([{
            id: userId,
            full_name: fullName,
            username: username,
            phone_number: phoneNumber,
            profile_picture: null,
        }]);

    // Hide loading state
    registerBtn.disabled = false;
    registerBtnText.classList.remove('hidden');
    registerBtnLoading.classList.add('hidden');

    if (profileError) {
        registerMessage.textContent = `Error storing profile data: ${profileError.message}`;
        registerMessage.classList.remove('hidden');
        registerMessage.classList.add('text-red-500');
        return;
    }

    // Show success message and redirect
    registerMessage.textContent = 'Registration successful! Redirecting to dashboard...';
    registerMessage.classList.remove('hidden');
    registerMessage.classList.add('text-green-500');
    window.location.href = 'dashboard.html';
};

// Handle login
const handleLogin = async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginMessage = document.getElementById('login-message');
    const loginBtn = document.getElementById('login-btn');
    const loginBtnText = document.getElementById('login-btn-text');
    const loginBtnLoading = document.getElementById('login-btn-loading');

    const email = emailInput?.value;
    const password = passwordInput?.value;

    if (!loginMessage || !loginBtn || !loginBtnText || !loginBtnLoading) return;

    // Show loading state
    loginBtn.disabled = true;
    loginBtnText.classList.add('hidden');
    loginBtnLoading.classList.remove('hidden');
    loginMessage.classList.add('hidden');

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });

    // Hide loading state
    loginBtn.disabled = false;
    loginBtnText.classList.remove('hidden');
    loginBtnLoading.classList.add('hidden');

    if (error) {
        loginMessage.textContent = error.message === 'Invalid login credentials' ?
            'Error: Invalid credentials or email not confirmed. Check your email for a confirmation link.' :
            `Error: ${error.message}`;
        loginMessage.classList.remove('hidden');
        loginMessage.classList.add('text-red-500');
    } else {
        loginMessage.textContent = 'Login successful! Redirecting...';
        loginMessage.classList.remove('hidden');
        loginMessage.classList.add('text-green-500');
        window.location.href = 'dashboard.html';
    }
};

// Handle logout
const handleLogout = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
    } else {
        localStorage.removeItem('profilePicture');
        window.location.href = 'login.html';
    }
};

// **Profile Modal & Data Functions**
const fetchUserProfile = async () => {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
        window.location.href = 'login.html';
        return;
    }

    const profileDetailsEmail = document.getElementById('profile-details-email');
    const profileDetailsUsername = document.getElementById('profile-details-username');
    const profilePic = document.getElementById('profile-picture');

    if (profileDetailsEmail) {
        profileDetailsEmail.textContent = user.email || 'Not set';
    }

    const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('username, profile_picture')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile data:', profileError.message);
        if (profileDetailsUsername) {
            profileDetailsUsername.textContent = 'Error loading';
        }
    } else {
        if (profileDetailsUsername) {
            profileDetailsUsername.textContent = profileData.username || 'Not set';
        }
    }

    if (profilePic && profileData?.profile_picture) {
        const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
            .from('profile-pictures')
            .createSignedUrl(profileData.profile_picture, 3600);
        if (signedUrlError) {
            console.error('Error generating signed URL:', signedUrlError.message);
            profilePic.src = 'https://via.placeholder.com/150';
        } else {
            profilePic.src = signedUrlData.signedUrl;
        }
    } else if (profilePic) {
        profilePic.src = 'https://via.placeholder.com/150';
    }
};

// Handle username editing
const handleEditUsername = async () => {
    const newUsernameInput = document.getElementById('new-username');
    const usernameEditMessage = document.getElementById('username-edit-message');
    const saveUsernameBtn = document.getElementById('save-username');
    const saveUsernameText = document.getElementById('save-username-text');
    const saveUsernameLoading = document.getElementById('save-username-loading');

    if (!newUsernameInput || !usernameEditMessage || !saveUsernameBtn || !saveUsernameText || !saveUsernameLoading) return;

    const newUsername = newUsernameInput.value.trim();
    if (!newUsername) {
        usernameEditMessage.textContent = 'Error: Username cannot be empty!';
        usernameEditMessage.classList.remove('hidden');
        usernameEditMessage.classList.add('text-red-500');
        return;
    }

    saveUsernameBtn.disabled = true;
    saveUsernameText.classList.add('hidden');
    saveUsernameLoading.classList.remove('hidden');
    usernameEditMessage.classList.add('hidden');

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
        usernameEditMessage.textContent = 'Error: User not authenticated!';
        usernameEditMessage.classList.remove('hidden');
        usernameEditMessage.classList.add('text-red-500');
        saveUsernameBtn.disabled = false;
        saveUsernameText.classList.remove('hidden');
        saveUsernameLoading.classList.add('hidden');
        return;
    }

    const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', user.id);

    saveUsernameBtn.disabled = false;
    saveUsernameText.classList.remove('hidden');
    saveUsernameLoading.classList.add('hidden');

    if (updateError) {
        usernameEditMessage.textContent = `Error: ${updateError.message}`;
        usernameEditMessage.classList.remove('hidden');
        usernameEditMessage.classList.add('text-red-500');
        return;
    }

    const profileDetailsUsername = document.getElementById('profile-details-username');
    if (profileDetailsUsername) {
        profileDetailsUsername.textContent = newUsername;
    }
    document.getElementById('username-edit-form').classList.add('hidden');
    usernameEditMessage.textContent = 'Username updated successfully!';
    usernameEditMessage.classList.remove('hidden');
    usernameEditMessage.classList.add('text-green-500');
};

// Handle profile picture upload
const handleProfilePictureUpload = async (file) => {
    const usernameEditMessage = document.getElementById('username-edit-message');

    if (!file) return;

    if (usernameEditMessage) {
        usernameEditMessage.textContent = 'Uploading picture...';
        usernameEditMessage.classList.remove('hidden', 'text-red-500', 'text-green-500');
        usernameEditMessage.classList.add('text-yellow-500');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
        if (usernameEditMessage) {
            usernameEditMessage.textContent = 'Error: User not authenticated!';
            usernameEditMessage.classList.remove('text-yellow-500');
            usernameEditMessage.classList.add('text-red-500');
        }
        return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (uploadError) {
        console.error('Error uploading profile picture:', uploadError.message);
        if (usernameEditMessage) {
            usernameEditMessage.textContent = `Error uploading picture: ${uploadError.message}`;
            usernameEditMessage.classList.remove('text-yellow-500');
            usernameEditMessage.classList.add('text-red-500');
        }
        return;
    }

    const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ profile_picture: filePath })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error updating profile picture path:', updateError.message);
        if (usernameEditMessage) {
            usernameEditMessage.textContent = `Error updating profile: ${updateError.message}`;
            usernameEditMessage.classList.remove('text-yellow-500');
            usernameEditMessage.classList.add('text-red-500');
        }
        return;
    }

    fetchUserProfile(); // Refresh profile data after successful upload
    if (usernameEditMessage) {
        usernameEditMessage.textContent = 'Profile picture updated successfully!';
        usernameEditMessage.classList.remove('text-yellow-500');
        usernameEditMessage.classList.add('text-green-500');
    }
};

// **Event Listeners**
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const profileDetailsModal = document.getElementById('profile-details-modal');
    const profilePicInput = document.getElementById('profile-picture-input');
    const closeProfileDetailsModal = document.getElementById('close-profile-details-modal');
    const editUsernameBtn = document.querySelector('.edit-username');
    const saveUsernameBtn = document.getElementById('save-username');
    const openModalBtn = document.getElementById('open-profile-modal-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (profileDetailsModal) {
        fetchUserProfile();
    }

    if (profilePicInput) {
        profilePicInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleProfilePictureUpload(file);
            }
        });
    }

    if (closeProfileDetailsModal) {
        closeProfileDetailsModal.addEventListener('click', () => {
            profileDetailsModal.classList.add('hidden');
        });
    }
    
    // Add logic to toggle edit form and handle save
    const usernameEditForm = document.getElementById('username-edit-form');
    if (editUsernameBtn && usernameEditForm) {
        editUsernameBtn.addEventListener('click', () => {
            usernameEditForm.classList.toggle('hidden');
            const profileDetailsUsername = document.getElementById('profile-details-username');
            const newUsernameInput = document.getElementById('new-username');
            if (!usernameEditForm.classList.contains('hidden')) {
                newUsernameInput.value = profileDetailsUsername.textContent;
            }
        });
    }
    
    if (saveUsernameBtn) {
        saveUsernameBtn.addEventListener('click', handleEditUsername);
    }

    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            profileDetailsModal.classList.remove('hidden');
            fetchUserProfile(); // Re-fetch data every time modal is opened
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});
