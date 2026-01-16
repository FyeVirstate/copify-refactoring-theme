"use client";

import DashboardHeader from "@/components/DashboardHeader";
import Link from "next/link";
import Image from "next/image";

interface SupplierProfile {
  id: string;
  name: string;
  subtitle: string;
  company: string;
  avatar: string;
  whatsappLink: string;
  contactLanguages: string;
  yearsOfActivity: number;
  location: string;
  ships: string;
  transactionVolume: string;
  deliveryTime: string;
  delayOfTreatment: string;
  employees: number;
  warehouse: number;
  area: string;
  onTimeDelivery: string;
  sentFrom: string;
}

const suppliers: SupplierProfile[] = [
  {
    id: "winona",
    name: "Winona",
    subtitle: "Guangzhou, Chine",
    company: "Imp&Exp Co. LTD",
    avatar: "https://development.copyfy.io/admin_theme/app-assets/images/avatars/winona.png",
    whatsappLink: "https://wa.me/8615521008023?text=Hello%20je%20viens%20de%20la%20part%20de%20Copyfy",
    contactLanguages: "Anglais / Chinois",
    yearsOfActivity: 5,
    location: "Guangzhou, Chine",
    ships: "1000-2000 commandes/jour",
    transactionVolume: "/",
    deliveryTime: "7 à 15 jours",
    delayOfTreatment: "24 heures",
    employees: 4,
    warehouse: 1,
    area: "120m³",
    onTimeDelivery: "96%",
    sentFrom: "Guangzhou, Chine",
  },
  {
    id: "rm_sourcing",
    name: "RM Sourcing",
    subtitle: "RM Sourcing",
    company: "NextLevel Limited",
    avatar: "https://development.copyfy.io/admin_theme/app-assets/images/avatars/rm_sourcing.jpeg",
    whatsappLink: "https://wa.me/+33749638416?text=Hello%20je%20viens%20de%20la%20part%20de%20Copyfy",
    contactLanguages: "Français / Anglais",
    yearsOfActivity: 4,
    location: "Nanjing, Chine",
    ships: "1000-1500 commandes/jour",
    transactionVolume: "/",
    deliveryTime: "5 à 10 jours",
    delayOfTreatment: "24 heures",
    employees: 10,
    warehouse: 1,
    area: "160m³",
    onTimeDelivery: "95%",
    sentFrom: "Shanghai, Chine",
  },
];

function SupplierCard({ supplier }: { supplier: SupplierProfile }) {
  return (
    <div className="border-gray p-4 rounded-15 bg-white" style={{ flex: 1 }}>
      <h5 className="fs-15 mb-4">
        <span className="text-dark">Profil</span>
      </h5>
      
      {/* Profile Header */}
      <div className="d-lg-flex d-md-flex d-block align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <div 
            className="profilePage-img"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: '#f3f4f6',
            }}
          >
            <img 
              src={supplier.avatar} 
              alt={supplier.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0c6cfb;color:white;font-weight:bold;font-size:18px">${supplier.name.charAt(0)}</div>`;
              }}
            />
          </div>
          <div className="ms-3">
            <h3 className="fs-15 mb-1 fw-600">{supplier.name}</h3>
            <h5 className="fs-15 mb-0 text-gray">{supplier.subtitle}</h5>
          </div>
        </div>
        <div className="text-lg-end text-md-end my-lg-0 my-md-0 my-4">
          <h4 className="fs-15 text-dark d-flex align-items-center justify-content-end">
            <svg 
              width="22" 
              height="20" 
              viewBox="0 0 22 20" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="me-2"
            >
              <path 
                d="M12 9H16.8C17.9201 9 18.4802 9 18.908 9.21799C19.2843 9.40973 19.5903 9.71569 19.782 10.092C20 10.5198 20 11.0799 20 12.2V19M12 19V4.2C12 3.0799 12 2.51984 11.782 2.09202C11.5903 1.71569 11.2843 1.40973 10.908 1.21799C10.4802 1 9.9201 1 8.8 1H5.2C4.0799 1 3.51984 1 3.09202 1.21799C2.71569 1.40973 2.40973 1.71569 2.21799 2.09202C2 2.51984 2 3.0799 2 4.2V19M21 19H1M5.5 5H8.5M5.5 9H8.5M5.5 13H8.5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            {supplier.company}
          </h4>
        </div>
      </div>

      {/* WhatsApp Button */}
      <a 
        href={supplier.whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-success w-100 mt-3 rounded-8 fs-15 py-12 d-flex align-items-center justify-content-center text-decoration-none"
        style={{ padding: '12px' }}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="me-2"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Contacter sur WhatsApp
      </a>

      {/* Profile Details */}
      <div>
        <ProfileRow label="Langues de contact" value={supplier.contactLanguages} />
        <ProfileRow label="Années d'activité" value={String(supplier.yearsOfActivity)} />
        <ProfileRow label="Localisation" value={supplier.location} />
        <ProfileRow label="Expédie" value={supplier.ships} />
        <ProfileRow label="Volume de transactions" value={supplier.transactionVolume} />
        <ProfileRow label="Délai d'expédition" value={supplier.deliveryTime} />
        <ProfileRow label="Délai de traitement" value={supplier.delayOfTreatment} />
        <ProfileRow label="Employés" value={String(supplier.employees)} />
        <ProfileRow label="Entrepôt" value={String(supplier.warehouse)} />
        <ProfileRow label="Superficie" value={supplier.area} />
        <ProfileRow label="Taux de livraison à temps" value={supplier.onTimeDelivery} />
        <ProfileRow label="Envoyé depuis" value={supplier.sentFrom} isLast />
      </div>
    </div>
  );
}

function ProfileRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div 
      className={`d-flex justify-content-between py-4 ${!isLast ? 'border-b-gray' : ''}`}
      style={!isLast ? { borderBottom: '1px solid #e5e7eb' } : {}}
    >
      <h5 className="mb-0 fs-15">{label}</h5>
      <h5 className="mb-0 fs-15 text-gray text-end">{value}</h5>
    </div>
  );
}

export default function SupplierProfilesPage() {
  return (
    <>
      <DashboardHeader
        title="Fournisseur"
        subtitle="Partenaire Officiel de Copyfy"
        icon="ri-truck-line"
        iconType="icon"
        showSearch={false}
        showStats={false}
      >
        {/* AutoDS Button */}
        <div className="d-flex align-items-center">
          <Link 
            href="/dashboard/suppliers"
            className="btn btn-secondary w-icon text-decoration-none"
          >
            <i className="ri-arrow-left-line btn-icon-sm" style={{ fontSize: '16px', color: '#99a0ae' }}></i>
            <span className="text-gray">AutoDS</span>
          </Link>
        </div>
      </DashboardHeader>

      <div className="bg-white home-content-wrapper">
        <div className="p-2 w-max-width-xl mx-auto">
          <div 
            className="row m-0 p-lg-4 p-md-3 pt-lg-0 profile"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', alignItems: 'stretch' }}
          >
            {suppliers.map((supplier, index) => (
              <div 
                key={supplier.id}
                className={`${index === 0 ? 'pe-lg-2 pe-md-2' : 'ps-lg-2 ps-md-2'} px-0 ${index > 0 ? 'mt-lg-0 mt-md-0 mt-4' : ''}`}
                style={{ display: 'flex', marginTop: "0px !important"}}
              >
                <SupplierCard supplier={supplier} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
