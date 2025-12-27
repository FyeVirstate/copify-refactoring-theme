"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      setError("Erreur lors de la connexion Google");
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
        setIsLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Erreur lors de la connexion");
      setIsLoading(false);
    }
  };

  return (
    <div className="form-pages position-relative d-flex align-items-center justify-content-center py-5">
      <div        className="form-box"
      >
        <div          className="rounded-15 p-4 bg-white"
        >
          {/* Logo */}
          <div className="text-center mb-4">
            <img 
              src="/img/new-favicon/android-chrome-192x192.png" 
              className="auth-logo" 
              alt="Copyfy Logo" 
            />
            <h1 className="mb-3 fs-2 fw-600">Connectez-vous</h1>
            <p className="mb-0 text-sub">
              Vous n&apos;avez pas de compte ?{" "}
              <Link href="/register" className="text-primary text-decoration-none">
                S&apos;inscrire
              </Link>
            </p>
          </div>

              {/* Bouton Google */}
              <div className="text-center mt-2 mb-2">
                <a 
                  className="btn btn-secondary w-100" 
                  href="#" 
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleGoogleLogin();
                  }}
                >
                  <img width="20px" className="me-1" alt="Google sign-in" src="/img/google-logo-png_seeklogo-273191.png" />
                  Se connecter avec Google
                </a>

            {/* Séparateur */}
            <div className="fs-xs text-light-gray divider-text-line">
              <span className="divider-text">OU</span>
            </div>
          </div>

          {/* Success message after registration */}
          {justRegistered && (
            <div className="alert alert-success py-2 mb-3" role="alert">
              Compte créé avec succès ! Vous pouvez maintenant vous connecter.
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form method="POST" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="form-label text-dark fs-small">
                Adresse e-mail<span className="text-light-gray">*</span>
              </label>
              <input 
                type="text" 
                id="email" 
                name="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control" 
                placeholder="john@gmail.com"
                disabled={isLoading}
              />
            </div>
            <div className="mt-3 mb-4 password-container">
              <div className="w-100 d-flex justify-content-between">
                <label htmlFor="password" className="form-label me-auto fs-small text-dark">
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="text-decoration-none text-sub fs-xs">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  name="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control" 
                  placeholder="••••••••••••"
                  style={{ paddingRight: '45px' }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px'
                  }}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#555' }}>
                      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#555' }}>
                      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Connexion...
                </>
              ) : (
                "Connectez-vous"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="form-pages position-relative d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

