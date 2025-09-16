// Replace with your actual Supabase project URL and anon public key from Step 1
const SUPABASE_URL = 'https://bhqnwueocaobybbrinwf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocW53dWVvY2FvYnliYnJpbndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5ODA3MDAsImV4cCI6MjA3MzU1NjcwMH0.LQ9U5eblqrA4wCGXk1v3PHCmb1NPE7kdGJHeT1CmEhI';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    // Password validation: Check if passwords match
    if (password !== confirmPassword) {
        registerMessage.textContent = 'Error: Passwords do not match!';
        registerMessage.classList.remove('hidden');
        registerMessage.classList.add('text-red-500');
        return;
    }

    // Step 1: Register the user with Supabase Authentication
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
        // Redirect to your dashboard or main page
        window.location.href = 'dashboard.html';
    }
};

// Add event listeners to the forms
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});
