// **Supabase Initialization**
// Replace with your actual Supabase project URL and anon public key
const SUPABASE_URL = 'https://bhqnwueocaobybbrinwf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocW53dWVvY2FvYnliYnJpbndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5ODA3MDAsImV4cCI6MjA3MzU1NjcwMH0.LQ9U5eblqrA4wCGXk1v3PHCmb1NPE7kdGJHeT1CmEhI';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// **Authentication Functions**
// Function to handle registration
const handleRegister = async (event) => {
    event.preventDefault();

    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('register-email');
    const usernameInput = document.getElementById('register-username');
    const phoneNumberInput = document.getElementById('phone-number');
    const passwordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const registerMessage = document.getElementById('register-message');

    const fullName = fullNameInput.value;
    const email = emailInput.value;
    const username = usernameInput.value;
    const phoneNumber = phoneNumberInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    registerMessage.classList.add('hidden');

    if (password !== confirmPassword) {
        registerMessage.textContent = 'Error: Passwords do not match!';
        registerMessage.classList.remove('hidden');
        registerMessage.classList.add('text-red-500');
        return;
    }

    // Step 1: Register the user with Supabase Authentication and get a session
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

    // Step 2: Insert the additional profile data into the 'profiles' table
    const userId = authData.user.id;
    const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
            id: userId,
            full_name: fullName,
            username: username,
            phone_number: phoneNumber
        }]);

    if (profileError) {
        registerMessage.textContent = `Error storing profile data: ${profileError.message}`;
        registerMessage.classList.remove('hidden');
        registerMessage.classList.add('text-red-500');
        return;
    }

    // Redirect to the dashboard immediately after successful registration
    registerMessage.textContent = 'Registration successful! Redirecting...';
    registerMessage.classList.remove('hidden');
    registerMessage.classList.add('text-green-500');
    window.location.href = 'dashboard.html';
};

// Function to handle login
const handleLogin = async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginMessage = document.getElementById('login-message');

    const email = emailInput.value;
    const password = passwordInput.value;

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
        // Redirect to the dashboard after a successful login
        loginMessage.textContent = 'Login successful! Redirecting...';
        loginMessage.classList.remove('hidden');
        loginMessage.classList.add('text-green-500');
        window.location.href = 'dashboard.html';
    }
};

// Function to handle logout
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
const profileDetailsModal = document.getElementById('profile-details-modal');
const closeProfileDetailsModal = document.getElementById('close-profile-details-modal');
const profilePic = document.getElementById('profile-picture');
const profilePicInput = document.getElementById('profile-picture-input');
const profileDetailsEmail = document.getElementById('profile-details-email');
const profileDetailsUsername = document.getElementById('profile-details-username');
const profileDetailsAddress = document.getElementById('profile-details-address');

const fetchUserProfile = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        window.location.href = 'login.html';
        return;
    }

    profileDetailsEmail.textContent = user.email || 'Not set';

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile data:', profileError.message);
        profileDetailsUsername.textContent = 'Error loading';
    } else {
        profileDetailsUsername.textContent = profileData.username || 'Not set';
    }

    const savedPic = localStorage.getItem("profilePicture");
    if (savedPic) profilePic.src = savedPic;
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

    const dashboardPage = document.querySelector('body');
    if (dashboardPage && profileDetailsModal) {
        fetchUserProfile();

        profilePicInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const newPic = event.target.result;
                profilePic.src = newPic;
                localStorage.setItem("profilePicture", newPic);
            };
            reader.readAsDataURL(file);
        });

        closeProfileDetailsModal.addEventListener('click', () => {
            profileDetailsModal.classList.add('hidden');
        });

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
