import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-wrapper position-relative">
      <div className="container" style={{ maxWidth: '100%', paddingLeft: '15px', paddingRight: '15px' }}>
        {children}
      </div>
      {/* Glow Images */}
      <div className="glow-1" style={{ backgroundImage: 'url(/img/glow-img-1-min.png)' }}></div>
      <div className="glow-2" style={{ backgroundImage: 'url(/img/glow-img-2-min.png)' }}></div>
      <div className="glow-3" style={{ backgroundImage: 'url(/img/glow-img-3-min.png)' }}></div>
    </div>
  );
}

