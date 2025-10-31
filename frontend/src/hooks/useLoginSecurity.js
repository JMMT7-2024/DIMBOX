import { useState, useEffect } from 'react';

export const useLoginSecurity = () => {
    const [attempts, setAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState(null);

    useEffect(() => {
        const storedAttempts = localStorage.getItem('loginAttempts');
        const storedLock = localStorage.getItem('loginLockedUntil');

        if (storedAttempts) setAttempts(parseInt(storedAttempts));
        if (storedLock && new Date(storedLock) > new Date()) {
            setLockedUntil(new Date(storedLock));
        }
    }, []);

    const recordAttempt = (success) => {
        if (success) {
            setAttempts(0);
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('loginLockedUntil');
            return true;
        }

        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('loginAttempts', newAttempts.toString());

        if (newAttempts >= 5) {
            const lockTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
            setLockedUntil(lockTime);
            localStorage.setItem('loginLockedUntil', lockTime.toISOString());
        }

        return false;
    };

    const isLocked = () => {
        if (lockedUntil && new Date() < lockedUntil) return true;
        if (lockedUntil && new Date() >= lockedUntil) {
            setLockedUntil(null);
            localStorage.removeItem('loginLockedUntil');
            localStorage.removeItem('loginAttempts');
            setAttempts(0);
        }
        return false;
    };

    return { attempts, lockedUntil, recordAttempt, isLocked };
};