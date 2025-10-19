// src/auth/AuthContext.jsx
import React, { createContext, useState, useContext } from 'react'; // Importa useContext
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Leemos los datos de localStorage AL INICIAR
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('me')));
    const [token, setToken] = useState(() => localStorage.getItem('access'));

    const login = async (username, password) => {
        try {
            console.log("AuthContext: 1. Llamando a api.login...");
            const { access, refresh, me } = await api.login(username, password);
            console.log("AuthContext: 2. API OK. Guardando token:", access);

            localStorage.setItem('access', access);
            localStorage.setItem('refresh', refresh);
            localStorage.setItem('me', JSON.stringify(me));

            console.log("AuthContext: 3. Token guardado en localStorage.");

            setUser(me);
            setToken(access);

            console.log("AuthContext: 4. Estado de React actualizado.");
            return me;
        } catch (error) {
            console.error("AuthContext: ERROR en login", error);
            localStorage.clear();
            setUser(null);
            setToken(null);
            throw error;
        }
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        setToken(null);
        // Recargamos para asegurar que todo el estado se limpie
        window.location.replace('/login');
    };

    const value = { user, token, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- ¡¡ESTA ES LA LÍNEA QUE PROBABLEMENTE FALTABA!! ---
export const useAuth = () => {
    return useContext(AuthContext);
};