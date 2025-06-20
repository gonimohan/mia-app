"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  isConfigured: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  isConfigured: false,
  error: null,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      setError("Supabase is not configured")
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) {
          console.error("Error getting session:", error)
          setError(error.message)
        } else {
          setUser(session?.user ?? null)
          setError(null)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
        setError("Failed to initialize authentication")
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)
      setUser(session?.user ?? null)
      setLoading(false)
      setError(null)
    })

    return () => subscription.unsubscribe()
  }, [configured])

  const signOut = async () => {
    if (!configured) return

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Error signing out:", error)
        setError(error.message)
      }
    } catch (error) {
      console.error("Error signing out:", error)
      setError("Failed to sign out")
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isConfigured: configured, error }}>
      {children}
    </AuthContext.Provider>
  )
}
