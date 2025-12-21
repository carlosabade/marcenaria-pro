
import React, { useState } from 'react';
import { Icons } from './Icon';
import { UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';
import { getDeviceId, saveUser, getUser } from '../services/storageService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface AuthLoginProps {
    onLogin: (user: UserProfile) => void;
}


// Ícone do Google (SVG)
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
        </g>
    </svg>
);

const AuthLogin: React.FC<AuthLoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [document, setDocument] = useState(''); // CPF/CNPJ

    const [loading, setLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    // Estado para controlar se é Login ou Cadastro
    const [isRegistering, setIsRegistering] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                // --- CADASTRO ---
                if (!email || !password || !name) {
                    throw new Error("Preencha nome, email e senha.");
                }

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                            document_id: document
                        }
                    }
                });

                if (authError) throw authError;

                if (authData.user) {
                    // Criar perfil inicial no banco, se não existir (trigger pode fazer isso, mas vamos garantir via client side por enquanto ou assumir que o app vai sincronizar depois)
                    // Para manter compatibilidade com o sistema atual que espera um objeto UserProfile local:
                    const newUserProfile: UserProfile = {
                        name: name,
                        email: email,
                        document: document,
                        plan: 'free',
                        downloadCount: 0,
                        devices: [{ id: getDeviceId(), name: 'Web Browser', lastAccess: new Date().toISOString() }]
                    };

                    // Salvar no storage local (como o app espera)
                    saveUser(newUserProfile);

                    // Também tentar salvar/sincronizar na tabela 'profiles' do Supabase para garantir
                    await supabase.from('profiles').upsert({
                        email: email,
                        data: newUserProfile
                    });

                    onLogin(newUserProfile);
                    alert("Conta criada com sucesso!");
                }

            } else {
                // --- LOGIN ---
                if (!email || !password) {
                    throw new Error("Preencha email e senha.");
                }

                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (authError) throw authError;

                if (authData.user) {
                    // Buscar perfil do banco
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('data')
                        .eq('email', email)
                        .maybeSingle();

                    if (profileData?.data) {
                        const userProfile = profileData.data as UserProfile;
                        saveUser(userProfile);
                        onLogin(userProfile);
                    } else {
                        // Se logou no Auth mas não tem perfil (caso raro, ou usuário antigo), criar um básico
                        const basicProfile: UserProfile = {
                            name: authData.user.user_metadata.full_name || 'Usuário',
                            email: email,
                            document: authData.user.user_metadata.document_id || '',
                            plan: 'free',
                            downloadCount: 0,
                            devices: [{ id: getDeviceId(), name: 'Web Browser', lastAccess: new Date().toISOString() }]
                        };
                        saveUser(basicProfile);
                        onLogin(basicProfile);
                    }
                }
            }

        } catch (err: any) {
            console.error(err);
            if (err.message && (err.message.includes("Email not confirmed") || err.message.includes("Email verification is pending"))) {
                setError("Por favor, verifique seu email para confirmar o cadastro antes de fazer login.");
            } else if (err.message && err.message.includes("Invalid login credentials")) {
                setError("Email ou senha incorretos.");
            } else {
                setError(err.message || "Ocorreu um erro na autenticação.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                    <div className="bg-wood-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-3">
                        <Icons.Hammer className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Marcenaria<span className="text-wood-500">Pro</span>
                    </h1>
                    <p className="text-slate-400 mt-2">
                        {isRegistering ? 'Crie sua conta gratuita' : 'Gestão profissional para sua oficina'}
                    </p>
                </div>


                <div className="space-y-6">
                    {/* Formulário */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        {isRegistering && (
                            <Input
                                label="Seu Nome"
                                placeholder="Ex: João Marceneiro"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        )}

                        <Input
                            label="Email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />

                        <Input
                            label="Senha"
                            type="password"
                            placeholder="******"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />

                        {isRegistering && (
                            <Input
                                label="CPF ou CNPJ"
                                placeholder="000.000.000-00"
                                value={document}
                                onChange={e => setDocument(e.target.value)}
                            />
                        )}

                        {error && (
                            <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50 animate-pulse">{error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={loading}
                            variant={isRegistering ? 'primary' : 'primary'}
                        >
                            {isRegistering ? (
                                <>Criar Conta Grátis <Icons.UserPlus className="w-4 h-4 ml-2" /></>
                            ) : (
                                <>Entrar no Sistema <Icons.LogIn className="w-4 h-4 ml-2" /></>
                            )}
                        </Button>
                    </form>

                    {/* Toggle Login/Cadastro */}
                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                            }}
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            {isRegistering ? (
                                <span>Já tem uma conta? <strong className="text-wood-400 underline">Faça Login</strong></span>
                            ) : (
                                <span>Não tem conta? <strong className="text-green-400 underline">Cadastre-se aqui</strong></span>
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    Acesso seguro via Supabase Auth.
                </p>
            </div>
        </div>
    );
};

export default AuthLogin;
