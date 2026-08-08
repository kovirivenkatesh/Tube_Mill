import { createContext, useContext, useEffect, useState } from "react";
import { api, clearAuth, getStoredUser, getToken, persistUser, setAuth } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(!!getToken());

  const applyUser = (u) => {
    setUser(u);
    if (getToken()) persistUser(u);
  };

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(({ user: u }) => applyUser(u))
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user: u } = await api.login({ email, password });
    setAuth(token, u);
    setUser(u);
    return u;
  };

  const register = async (name, email, password) => {
    const { token, user: u } = await api.register({ name, email, password });
    setAuth(token, u);
    setUser(u);
    return u;
  };

  const updateSupervisorEmail = async (supervisorEmail) => {
    const { user: u } = await api.updateSupervisorEmail(supervisorEmail);
    applyUser(u);
    return u;
  };

  const updateProfileImage = async (profileImage) => {
    const { user: u } = await api.updateProfileImage(profileImage);
    applyUser(u);
    return u;
  };

  const removeProfileImage = async () => {
    const { user: u } = await api.removeProfileImage();
    applyUser(u);
    return u;
  };

  const updateUserName = async (name) => {
    const { user: u, token } = await api.updateUserName(name);
    if (token) localStorage.setItem("token", token);
    applyUser(u);
    return u;
  };

  const setUserFromServer = (u) => applyUser(u);

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateSupervisorEmail, updateProfileImage, removeProfileImage, updateUserName, setUserFromServer }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Where to send someone after login based on DB role (`user` | `admin`). */
export function getHomePath(user) {
  if (!user) return "/login";
  return user.role === "admin" ? "/admin" : "/departments";
}
