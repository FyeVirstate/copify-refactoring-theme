"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      setError("Erreur lors de l'inscription avec Google");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate password confirmation
    if (formData.password !== formData.passwordConfirm) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          lang: "fr",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "EMAIL_EXISTS") {
          setError("Un compte avec cet email existe déjà. Veuillez vous connecter.");
        } else if (data.error === "GOOGLE_ACCOUNT_EXISTS") {
          setError("Un compte Google avec cet email existe déjà. Veuillez vous connecter avec Google.");
        } else if (data.details) {
          setError(data.details[0]?.message || "Erreur de validation");
        } else {
          setError(data.message || "Erreur lors de l'inscription");
        }
        setIsLoading(false);
        return;
      }

      // Registration successful - redirect to login with success message
      router.push("/login?registered=true");
    } catch (err) {
      setError("Erreur lors de l'inscription. Veuillez réessayer.");
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
            <h1 className="mb-3 fs-2 fw-600">Créer un compte</h1>
            <p className="mb-0 text-sub">
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="text-primary text-decoration-none">
                Se connecter
              </Link>
            </p>
          </div>

          {/* Bouton Google */}
          <div className="text-center mt-2 mb-2">
            <button 
              className="btn btn-secondary w-100" 
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
            >
              <img width="20px" className="me-1" alt="Google sign-in" src="/img/google-logo-png_seeklogo-273191.png" />
              S&apos;inscrire avec Google
            </button>

            {/* Séparateur */}
            <div className="fs-xs text-light-gray divider-text-line">
              <span className="divider-text">OU</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleRegister}>
            {/* Nom */}
            <div>
              <label htmlFor="name" className="form-label text-dark fs-small">
                Nom complet<span className="text-light-gray">*</span>
              </label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-control" 
                placeholder="Votre nom"
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="mt-3">
              <label htmlFor="email" className="form-label text-dark fs-small">
                Adresse e-mail<span className="text-light-gray">*</span>
              </label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-control" 
                placeholder="nom@email.com"
                required
                disabled={isLoading}
              />
            </div>

            {/* Mot de passe */}
            <div className="mt-3">
              <label htmlFor="password" className="form-label fs-small text-dark">
                Mot de passe<span className="text-light-gray">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  name="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="form-control" 
                  placeholder="••••••••••••"
                  required
                  minLength={8}
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
              <small className="text-muted">Minimum 8 caractères</small>
            </div>

            {/* Confirmation mot de passe */}
            <div className="mt-3 mb-4">
              <label htmlFor="passwordConfirm" className="form-label fs-small text-dark">
                Confirmer le mot de passe<span className="text-light-gray">*</span>
              </label>
              <input 
                type={showPassword ? "text" : "password"} 
                id="passwordConfirm" 
                name="passwordConfirm" 
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                className="form-control" 
                placeholder="••••••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <button className="btn btn-primary w-100" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Création...
                </>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
