import React, { createContext, useContext, useCallback, useRef, type ReactNode } from 'react'

type HeaderActionContext = {
  setCreateHandler: (handler: (() => void) | null) => void
  triggerCreate: () => void
}

const Context = createContext<HeaderActionContext>({
  setCreateHandler: () => {},
  triggerCreate: () => {},
})

export function HeaderActionProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<(() => void) | null>(null)

  const setCreateHandler = useCallback((h: (() => void) | null) => {
    handlerRef.current = h
  }, [])

  const triggerCreate = useCallback(() => {
    handlerRef.current?.()
  }, [])

  return (
    <Context.Provider value={{ setCreateHandler, triggerCreate }}>
      {children}
    </Context.Provider>
  )
}

export function useHeaderAction() {
  return useContext(Context)
}
