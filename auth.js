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

    registerMessage.textContent = 'Registration successful! Check your email to confirm.';
    registerMessage.classList.remove('hidden');
    registerMessage.classList.add('text-green-500');
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
        // Clear any local storage data and redirect to the login page
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
const profileDetailsAddress = document.getElementById('profile-details-address'); // This will still show 'Not set' as you don't have this field in your DB yet

// Function to fetch and display user profile information
const fetchUserProfile = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        // User not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }

    // Set email directly from the user object
    profileDetailsEmail.textContent = user.email || 'Not set';

    // Fetch the rest of the profile data from the 'profiles' table
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username') // We are only selecting the username for now as that is the only field you have in the modal
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile data:', profileError.message);
        profileDetailsUsername.textContent = 'Error loading';
    } else {
        profileDetailsUsername.textContent = profileData.username || 'Not set';
    }
    
    // Check if the user has a profile picture saved in local storage
    const savedPic = localStorage.getItem("profilePicture");
    if (savedPic) profilePic.src = savedPic;
};

// **Event Listeners**
document.addEventListener('DOMContentLoaded', () => {
    // --- Login/Registration Forms ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // --- Dashboard & Profile Modal ---
    const dashboardPage = document.querySelector('body'); // or a more specific element on your dashboard page
    if (dashboardPage && profileDetailsModal) {
        // If we are on the dashboard page, fetch the profile data
        fetchUserProfile();

        // Handle the profile picture upload
        profilePicInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const newPic = event.target.result;
                profilePic.src = newPic;
                localStorage.setItem("profilePicture", newPic); // Save the image to local storage
            };
            reader.readAsDataURL(file);
        });

        // Handle closing the profile modal
        closeProfileDetailsModal.addEventListener('click', () => {
            profileDetailsModal.classList.add('hidden');
        });

        // Add a listener to open the modal (you'll need a button for this)
        const openModalBtn = document.getElementById('open-profile-modal-btn');
        if (openModalBtn) {
            openModalBtn.addEventListener('click', () => {
                profileDetailsModal.classList.remove('hidden');
            });
        }

        // Add a listener for the logout button (you'll need a button for this)
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
});
