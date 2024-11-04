
'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface UserType {
    id: number;
    email: string;
    // Add any other fields from your profiles table in the future 
    // For example:
    // name: string;
    // major: string;
    // etc...
}

interface UserContextType {
    user: UserType | null;
    setUser: (user: UserType | null) => void;
}

const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserType | null>(null);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}