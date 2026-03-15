import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthChange, getUserProfile, logoutUser } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    
    try {
      unsubscribe = onAuthChange(async (firebaseUser) => {
        setUser(firebaseUser);
        
        if (firebaseUser) {
          try {
            const profile = await getUserProfile(firebaseUser.uid);
            setUserProfile(profile);
          } catch (error) {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      });
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const isInstructor = userProfile?.role === "instructor";
  const isStudent = userProfile?.role === "student";

  const value = {
    user,
    userProfile,
    loading,
    logout,
    isInstructor,
    isStudent,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
