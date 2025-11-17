import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, UserProfile } from '../lib/supabase'; 
import { Session, User } from '@supabase/supabase-js';

export type AppRole = 'consumer' | 'seller' | 'supplier';

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  activeRole: AppRole;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (
    email: string, 
    pass: string, 
    name: string, 
    role: AppRole, 
    storeOrCompany: string,
    documentNumber: string
  ) => Promise<any>;
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
    console.log("[Auth] Iniciando AuthProvider...");

    // Timeout de segurança para destravar a tela se algo demorar muito
    const safetyTimeout = setTimeout(() => {
      if (loading && mounted) {
        console.warn("[Auth] Timeout de segurança. Forçando fim do loading.");
        setLoading(false);
      }
    }, 4000);

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && mounted) {
          setUser(session.user);
          await fetchProfile(session.user);
        }
      } catch (error) {
        console.error("[Auth] Erro na inicialização:", error);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[Auth] Evento: ${event}`);
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          await fetchProfile(session.user); // Busca ou cria o perfil
          setLoading(false); // Garante que o loading pare
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setActiveRole('consumer');
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- FUNÇÃO DE BUSCA COM AUTO-CORREÇÃO ---
  const fetchProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data) {
        console.log("[Auth] Perfil carregado:", data.full_name);
        setProfile(data as UserProfile);
        
        // Define o perfil ativo
        if (data.is_seller) setActiveRole('seller');
        else if (data.is_supplier) setActiveRole('supplier');
        else setActiveRole('consumer');
      } else {
        // === AUTO-CORREÇÃO ===
        // Se o usuário existe no Auth mas não tem perfil (devido a erro anterior),
        // criamos o perfil básico agora para destravar o login.
        console.warn("[Auth] Perfil não encontrado. Tentando criar automaticamente (Auto-fix)...");
        
        const { error: insertError } = await supabase.from('user_profiles').insert({
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || 'Usuário',
          is_consumer: true
        });

        if (!insertError) {
           console.log("[Auth] Perfil criado com sucesso! Recarregando...");
           // Chama a função novamente para carregar o perfil recém-criado
           return fetchProfile(currentUser); 
        } else {
           console.error("[Auth] Falha na auto-correção:", insertError);
           // Se falhar mesmo tentando criar, aí sim deslogamos
           await signOut();
        }
      }
    } catch (err) {
      console.error("[Auth] Erro crítico em fetchProfile:", err);
      setLoading(false);
    }
  };

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signUp = async (
    email: string, pass: string, name: string, role: AppRole, storeOrCompany: string, documentNumber: string
  ) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, 
      password: pass, 
      options: { data: { full_name: name } },
    });

    if (authError) throw authError;

    // Se pede confirmação de email, paramos aqui para não dar erro 401
    if (authData.user && !authData.session) {
      alert("Cadastro iniciado! Verifique seu e-mail para confirmar a conta.");
      return;
    }

    const userId = authData.user!.id;

    // Tenta criar/atualizar perfis (Upsert)
    await supabase.from('user_profiles').upsert({
      id: userId,
      full_name: name,
      is_consumer: role === 'consumer' || true,
      is_seller: role === 'seller',
      is_supplier: role === 'supplier',
    });

    if (role === 'seller') {
      await supabase.from('seller_profiles').upsert({ 
          user_id: userId, store_name: storeOrCompany, document_number: documentNumber 
      }, { onConflict: 'user_id' });
    } else if (role === 'supplier') {
      await supabase.from('supplier_profiles').upsert({ 
          user_id: userId, company_name: storeOrCompany, document_number: documentNumber 
      }, { onConflict: 'user_id' });
    }

    await fetchProfile(authData.user!);
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    setLoading(false);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro no signOut:", error);
    }
  };

  const value = { user, profile, activeRole, signIn, signUp, signOut, setActiveRole, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth error');
  return context;
};