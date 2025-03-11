import { API_URL } from "@/lib/constants";
import { User } from "@ekonsilio/types";
import axios from "axios";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/auth/profile`, {
          withCredentials: true,
        });
        setUser(response.data);
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (err) {
        console.error("Authentication error:", err);
        setIsAuthenticated(false);
        setError("Failed to authenticate user");
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { user, isAuthenticated, isLoading, error };
};
