import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm'

const supabaseUrl = 'https://rznywdkwbqccnjeshatc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bnl3ZGt3YnFjY25qZXNoYXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNTY5ODksImV4cCI6MjA1NzczMjk4OX0.YQsG0cGX39gxBAFzh7k3xozWi-BekVRyGObk0qij5hU';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };


// Function to register user
export async function registerUser(username, email, password) {
    try {
        console.log('Starting registration process...');
        
        // First, create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) {
            console.error('Auth error:', authError);
            throw authError;
        }

        if (!authData?.user?.id) {
            throw new Error('No user ID received from auth');
        }

        // Then, store additional user data
        const { data, error } = await supabase
            .from('User_Details')
            .insert([
                {
                    username: username,
                    email: email,
                    user_id: authData.user.id
                }
            ])
            .select();

        if (error) {
            console.error('Database error:', error);
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error registering user:', error);
        return { success: false, error: error.message };
    }
}

// Function to login user
export async function loginUser(email, password) {
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })

        if (authError) throw authError

        // Get user details from our users table
        const { data: userDetails, error: userError } = await supabase            
            .from('User_Details')
            .select('*')
            .eq('user_id', authData.user.id)
            .single()

        if (userError) throw userError

        return { success: true, user: userDetails }
    } catch (error) {
        console.error('Error logging in:', error.message)
        return { success: false, error: error.message }
    }
}

// Function to check if user is authenticated
export async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
} 