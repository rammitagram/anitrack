import { createContext, useContext } from 'react';
import { AnimeResult } from './types';
export type Quick = { userId: string | null; statusById: Record<number, string>; save: (a: AnimeResult, status: string) => Promise<string | null>; onLogin: () => void };
export const QuickCtx = createContext<Quick>({ userId: null, statusById: {}, save: async () => null, onLogin: () => {} });
export const useQuick = () => useContext(QuickCtx);
