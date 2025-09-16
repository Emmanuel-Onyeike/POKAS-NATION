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

    const fullName = fullNameInput?.value;
    const email = emailInput?.value;
    let username = usernameInput?.value;
    const phoneNumber = phoneNumberInput?.value;
    const password = passwordInput?.value;
    const confirmPassword = confirmPasswordInput?.value;

    if (!registerMessage) return;

    registerMessage.classList.add('hidden');

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
        return;
    }

    // Validate password length
    if (password.length < 6) {
        registerMessage.textContent = 'Error: Password must be at least 6 characters!';
        registerMessage.classList.remove('hidden');
        registerMessage.classList.add('text-red-500');
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
        }]);

    if (profileError) {
        registerMessage.textContent = `Error storing profile data: ${profileError.message}`;
        registerMessage.classList.remove('hidden');
        registerMessage.classList.add('text-red-500');
        return;
    }

    // Show success (email confirmation required by default)
    registerMessage.textContent = 'Registration successful! Check your email to confirm.';
    registerMessage.classList.remove('hidden');
    registerMessage.classList.add('text-green-500');
};

// Handle login
const handleLogin = async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginMessage = document.getElementById('login-message');

    const email = emailInput?.value;
    const password = passwordInput?.value;

    if (!loginMessage) return;

    loginMessage.classList.add('hidden');

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        loginMessage.textContent = `Error: ${error.message}`;
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
        localStorage.removeItem("profilePicture");
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
    const profileDetailsAddress = document.getElementById('profile-details-address');

    if (profileDetailsEmail) {
        profileDetailsEmail.textContent = user.email || 'Not set';
    }

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username') // Removed address since it's not in the insert
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile data:', profileError.message);
        if (profileDetailsUsername) {
            profileDetailsUsername.textContent = 'Error loading';
        }
        if (profileDetailsAddress) {
            profileDetailsAddress.textContent = 'Not set';
        }
    } else {
        if (profileDetailsUsername) {
            profileDetailsUsername.textContent = profileData.username || 'Not set';
        }
        if (profileDetailsAddress) {
            profileDetailsAddress.textContent = 'Not set';
        }
    }

    const profilePic = document.getElementById('profile-picture');
    if (profilePic) {
        const savedPic = localStorage.getItem("profilePicture");
        if (savedPic) profilePic.src = savedPic;
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

    if (profileDetailsModal) {
        fetchUserProfile();

        if (profilePicInput) {
            profilePicInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const newPic = event.target.result;
                    const profilePic = document.getElementById('profile-picture');
                    if (profilePic) {
                        profilePic.src = newPic;
                        localStorage.setItem('profilePicture', newPic);
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        if (closeProfileDetailsModal) {
            closeProfileDetailsModal.addEventListener('click', () => {
                profileDetailsModal.classList.add('hidden');
            });
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
