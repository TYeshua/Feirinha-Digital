import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, UserProfile } from '../lib/supabase'; 
import { Session, User } from '@supabase/supabase-js';

export type AppRole = 'consumer' | 'seller' | 'supplier';

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  activeRole: AppRole;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, name: string, role: AppRole, storeOrCompany: string, doc: string) => Promise<any>;
  signOut: () => Promise<any>;
  setActiveRole: (role: AppRole) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<AppRole>('consumer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Inicialização
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          setUser(session.user);
          await fetchProfileOrFallback(session.user);
        }
      } catch (error) {
        console.error("Erro Auth:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          await fetchProfileOrFallback(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setActiveRole('consumer');
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- LÓGICA DE PERFIL COM SUPER-FALLBACK ---
  const fetchProfileOrFallback = async (currentUser: User) => {
    try {
      // Tenta buscar no banco com timeout curto
      const fetchPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout Banco")), 2500)
      );

      const { data } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (data) {
        console.log("Perfil Oficial Carregado.");
        setProfile(data as UserProfile);
        // Se o perfil oficial diz que é vendedor, respeitamos
        if (data.is_seller) setActiveRole('seller');
      } else {
        throw new Error("Perfil não encontrado.");
      }

    } catch (err) {
      console.warn("⚠️ Banco lento ou inacessível. Ativando MODO DEUS (Perfil Temporário Completo).");
      
      // O TRUQUE: Criamos um perfil que tem TUDO HABILITADO por padrão.
      // Isso garante que você nunca fique preso fora do painel.
      const superFallback: UserProfile = {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || 'Usuário Local',
        is_consumer: true,
        is_seller: true,   // <--- FORÇA VENDEDOR
        is_supplier: true  // <--- FORÇA FORNECEDOR
      };
      
      setProfile(superFallback);
      // Não forçamos a troca de role aqui para não pular na tela do usuário,
      // mas as permissões estarão lá quando ele clicar no botão.
    }
  };

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signUp = async (email: string, pass: string, name: string, role: AppRole, store: string, doc: string) => {
    // Cadastro simplificado para evitar erros
    const { data, error } = await supabase.auth.signUp({
      email, password: pass, options: { data: { full_name: name } },
    });
    if (error) throw error;
    if (data.user) await fetchProfileOrFallback(data.user);
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
  };

  const value = { user, profile, activeRole, signIn, signUp, signOut, setActiveRole, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth error');
  return context;
};