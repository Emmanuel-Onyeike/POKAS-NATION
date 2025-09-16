// **Supabase Initialization**
const SUPABASE_URL = 'https://bhqnwueocaobybbrinwf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocW53dWVvY2FvYnliYnJpbndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5ODA3MDAsImV4cCI6MjA3MzU1NjcwMH0.LQ9U5eblqrA4wCGXk1v3PHCmb1NPE7kdGJHeT1CmEhI';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    registerMessage.classList.add('hidden');
    // Show loading state
    registerBtn.disabled = true;
    registerBtnText.classList.add('hidden');
    registerBtnLoading.classList.remove('hidden');

    // Generate unique default username if none provided
    if (!username) {
        const randomId = Math.random().toString(36).substring(2, 8); // 6-char random string
        username = `user_${randomId}`; // e.g., user_abc123
    }

    // Validate passwords match
    if (password !== confirmPassword) {
        registerMessage.textContent = 'Error: Passwords do not match!';
        registerMessage.classList.remove('hidden');
        registerMessage.classList.add('text-red-500');
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
        registerBtn.disabled = false;
        registerBtnText.classList.remove('hidden');
        registerBtnLoading.classList.add('hidden');
        return;
    }

    // Step 1: Register user with Supabase Authentication
    const { data: authData, error: authError } = await supabase.auth.signUp({
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
    const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
            id: userId,
            full_name: fullName,
            username: username,
            phone_number: phoneNumber,
            profile_picture: null, // Initialize with no profile picture
        }]);

    if (profileError) {
        registerMessage.textContent = `Error storing profile data: ${profileError.message}`;
        registerMessage.classList.remove('hidden');
        registerMessage.classList.add('text-red-500');
        registerBtn.disabled = false;
        registerBtnText.classList.remove('hidden');
        registerBtnLoading.classList.add('hidden');
        return;
    }

    // Show success (email confirmation required by default)
    registerMessage.textContent = 'Registration successful! Check your email to confirm.';
    registerMessage.classList.remove('hidden');
    registerMessage.classList.add('text-green-500');
    registerBtn.disabled = false;
    registerBtnText.classList.remove('hidden');
    registerBtnLoading.classList.add('hidden');
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

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    // Hide loading state
    loginBtn.disabled = false;
    loginBtnText.classList.remove('hidden');
    loginBtnLoading.classList.add('hidden');

    if (error) {
        loginMessage.textContent = error.message === 'Invalid login credentials' 
            ? 'Error: Invalid credentials or email not confirmed. Check your email for a confirmation link.'
            : `Error: ${error.message}`;
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
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
    } else {
        localStorage.removeItem('profilePicture'); // Clear legacy localStorage
        window.location.href = 'login.html';
    }
};

// **Profile Modal & Data Functions**
const fetchUserProfile = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        window.location.href = 'login.html';
        return;
    }

    const profileDetailsEmail = document.getElementById('profile-details-email');
    const profileDetailsUsername = document.getElementById('profile-details-username');

    if (profileDetailsEmail) {
        profileDetailsEmail.textContent = user.email || 'Not set';
    }

    const { data: profileData, error: profileError } = await supabase
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

    const profilePic = document.getElementById('profile-picture');
    if (profilePic && profileData?.profile_picture) {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('profile-pictures')
            .createSignedUrl(profileData.profile_picture, 3600); // URL valid for 1 hour
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

    // Show loading state
    saveUsernameBtn.disabled = true;
    saveUsernameText.classList.add('hidden');
    saveUsernameLoading.classList.remove('hidden');
    usernameEditMessage.classList.add('hidden');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        usernameEditMessage.textContent = 'Error: User not authenticated!';
        usernameEditMessage.classList.remove('hidden');
        usernameEditMessage.classList.add('text-red-500');
        saveUsernameBtn.disabled = false;
        saveUsernameText.classList.remove('hidden');
        saveUsernameLoading.classList.add('hidden');
        return;
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', user.id);

    if (updateError) {
        usernameEditMessage.textContent = `Error: ${updateError.message}`;
        usernameEditMessage.classList.remove('hidden');
        usernameEditMessage.classList.add('text-red-500');
        saveUsernameBtn.disabled = false;
        saveUsernameText.classList.remove('hidden');
        saveUsernameLoading.classList.add('hidden');
        return;
    }

    // Update displayed username and hide edit form
    const profileDetailsUsername = document.getElementById('profile-details-username');
    if (profileDetailsUsername) {
        profileDetailsUsername.textContent = newUsername;
    }
    document.getElementById('username-edit-form').classList.add('hidden');
    usernameEditMessage.textContent = 'Username updated successfully!';
    usernameEditMessage.classList.remove('hidden');
    usernameEditMessage.classList.add('text-green-500');
    saveUsernameBtn.disabled = false;
    saveUsernameText.classList.remove('hidden');
    saveUsernameLoading.classList.add('hidden');
};

// Handle profile picture upload
const handleProfilePictureUpload = async (file) => {
    const profilePic = document.getElementById('profile-picture');
    const usernameEditMessage = document.getElementById('username-edit-message'); // Reuse for picture errors

    if (!file) return;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        if (usernameEditMessage) {
            usernameEditMessage.textContent = 'Error: User not authenticated!';
            usernameEditMessage.classList.remove('hidden');
            usernameEditMessage.classList.add('text-red-500');
        }
        return;
    }

    // Generate a unique file name using user ID and timestamp
    const fileName = `${user.id}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (uploadError) {
        console.error('Error uploading profile picture:', uploadError.message);
        if (usernameEditMessage) {
            usernameEditMessage.textContent = `Error uploading picture: ${uploadError.message}`;
            usernameEditMessage.classList.remove('hidden');
            usernameEditMessage.classList.add('text-red-500');
        }
        return;
    }

    // Update profile_picture path in profiles table
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture: fileName })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error updating profile picture path:', updateError.message);
        if (usernameEditMessage) {
            usernameEditMessage.textContent = `Error updating profile: ${updateError.message}`;
            usernameEditMessage.classList.remove('hidden');
            usernameEditMessage.classList.add('text-red-500');
        }
        return;
    }

    // Set the image source to the new uploaded file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('profile-pictures')
        .createSignedUrl(fileName, 3600);
    if (signedUrlError) {
        console.error('Error generating signed URL:', signedUrlError.message);
        if (profilePic) profilePic.src = 'https://via.placeholder.com/150';
    } else {
        if (profilePic) profilePic.src = signedUrlData.signedUrl;
    }

    if (usernameEditMessage) {
        usernameEditMessage.textContent = 'Profile picture updated successfully!';
        usernameEditMessage.classList.remove('hidden');
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
    const editUsernameBtn = document.getElementById('edit-username');
    const saveUsernameBtn = document.getElementById('save-username');

    if (profileDetailsModal) {
        fetchUserProfile();

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
                const usernameEditForm = document.getElementById('username-edit-form');
                if (usernameEditForm) usernameEditForm.classList.add('hidden');
            });
        }

        if (editUsernameBtn) {
            editUsernameBtn.addEventListener('click', () => {
                const usernameEditForm = document.getElementById('username-edit-form');
                if (usernameEditForm) {
                    usernameEditForm.classList.toggle('hidden');
                }
            });
        }

        if (saveUsernameBtn) {
            saveUsernameBtn.addEventListener('click', handleEditUsername);
        }

        const openModalBtn = document.getElementById('open-profile-modal-btn');
        if (openModalBtn) {
            openModalBtn.addEventListener('click', () => {
                profileDetailsModal.classList.remove('hidden');
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
});
