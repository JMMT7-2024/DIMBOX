import { useEffect, useState } from "react";
import { apiFetch, setTokens, clearTokens } from "../api/client";

export function useAuth() {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loadMe() {
        try {
            const cached = localStorage.getItem("me");
            if (cached) { setMe(JSON.parse(cached)); setLoading(false); return; }
            const data = await apiFetch("/me/");
            setMe(data);
            localStorage.setItem("me", JSON.stringify(data));
        } catch {
            setMe(null);
        } finally { setLoading(false); }
    }

    async function login(username, password) {
        const tokens = await apiFetch("/token/", {
            method: "POST",
            body: JSON.stringify({ username, password }),
            headers: { "Content-Type": "application/json" }
        });
        setTokens(tokens);
        localStorage.removeItem("me");
        await loadMe();
    }

    function logout() {
        clearTokens();
        setMe(null);
    }

    useEffect(() => { loadMe(); }, []);
    return { me, loading, login, logout, reload: loadMe };
}
