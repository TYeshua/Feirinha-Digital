import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Corrigido: Usando o caminho relativo correto
import { supabase, UserProfile } from '../lib/supabase'; 
import { Session, User } from '@supabase/supabase-js';

// Define o tipo de "Role"
export type AppRole = 'consumer' | 'seller' | 'supplier';

// Define o que o contexto vai fornecer
type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  activeRole: AppRole;
  signIn: (email: string, pass: string) => Promise<any>;
  // 1. Assinatura da função ATUALIZADA
  signUp: (
    email: string, 
    pass: string, 
    name: string, 
    role: AppRole, 
    storeOrCompany: string
  ) => Promise<any>;
  signOut: () => Promise<any>;
  setActiveRole: (role: AppRole) => void;
  loading: boolean;
};

// Cria o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define o Provedor do contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<AppRole>('consumer');
  const [loading, setLoading] = useState(true);

  // Escuta mudanças na autenticação do Supabase
  useEffect(() => {
    // ... (Sem alterações aqui) ...
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user);
      }
      setLoading(false);
    };
    getInitialSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          await fetchProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setActiveRole('consumer');
        }
        setLoading(false);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Busca o perfil do usuário no banco de dados
  const fetchProfile = async (user: User) => {
    // ... (Sem alterações aqui) ...
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data as UserProfile);
      // Define o perfil ativo inicial com base no que está no BD
      if (data.is_seller) setActiveRole('seller');
      else if (data.is_supplier) setActiveRole('supplier');
      else setActiveRole('consumer');
    } else if (error) {
      console.error('Erro ao buscar perfil:', error.message);
    }
  };

  // Função de Login
  const signIn = async (email: string, pass: string) => {
    // ... (Sem alterações aqui) ...
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  // --- 2. Função de Cadastro ATUALIZADA ---
  const signUp = async (
    email: string, 
    pass: string, 
    name: string, 
    role: AppRole, 
    storeOrCompany: string
  ) => {
    
    // Primeiro, cadastra o usuário no 'auth.users'
    // A trigger 'handle_new_user' ainda vai criar o perfil básico
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name, // A trigger usa isso
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Cadastro falhou, usuário não retornado.");

    // O usuário foi criado. Agora, atualizamos o perfil dele
    // com base na 'role' selecionada.
    const userId = authData.user.id;

    if (role === 'seller') {
      // 1. Atualiza o user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ is_seller: true, is_consumer: false }) // Desativa 'consumer' como padrão
        .eq('id', userId);
      
      if (profileError) throw profileError;

      // 2. Cria o seller_profiles
      const { error: sellerError } = await supabase
        .from('seller_profiles')
        .insert({
          user_id: userId,
          store_name: storeOrCompany,
          // Você pode adicionar valores padrão aqui se quiser
        });
      
      if (sellerError) throw sellerError;

    } else if (role === 'supplier') {
      // 1. Atualiza o user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ is_supplier: true, is_consumer: false }) // Desativa 'consumer'
        .eq('id', userId);
      
      if (profileError) throw profileError;

      // 2. Cria o supplier_profiles
      const { error: supplierError } = await supabase
        .from('supplier_profiles')
        .insert({
          user_id: userId,
          company_name: storeOrCompany,
        });

      if (supplierError) throw supplierError;
    }
    // Se a role for 'consumer', não fazemos nada extra,
    // pois a trigger já o criou como 'is_consumer: true'
  };

  // Função de Logout
  const signOut = async () => {
    // ... (Sem alterações aqui) ...
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Junta tudo para passar ao provider
  const value = {
    user,
    profile,
    activeRole,
    signIn,
    signUp,
    signOut,
    setActiveRole,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook customizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};