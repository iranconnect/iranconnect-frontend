//frontend/hooks/useSentryContextStatus.js
import { createContext, useContext } from "react";

export const SentryContextReady = createContext(false);

export function useSentryContextStatus() {
  return useContext(SentryContextReady);
}
