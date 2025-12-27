"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBilling } from "@/lib/hooks/use-billing";

interface Invoice {
  id: number;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
  invoiceUrl: string | null;
  pdfUrl: string | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { fetchInvoices } = useBilling();

  const loadInvoices = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const result = await fetchInvoices(pageNum);
      setInvoices(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(page);
  }, [page]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount / 100); // Stripe amounts are in cents
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="badge bg-success">Payée</span>;
      case 'open':
        return <span className="badge bg-warning">En attente</span>;
      case 'void':
        return <span className="badge bg-secondary">Annulée</span>;
      case 'uncollectible':
        return <span className="badge bg-danger">Impayée</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <>
      <DashboardHeader title="Factures" />

      <div className="bg-weak-50 home-content-wrapper">
        <div          className="bg-white rounded-15 data-view"
        >
          {/* Header */}
          <div className="dashboard-header d-flex justify-content-between align-items-center gap-4">
            <div className="dashboard-title d-flex">
              <div className="dashboard-title-img me-2">
                <i className="ri-file-list-3-line text-white"></i>
              </div>
              <div>
                <p className="dashboard-title-main mb-0">Factures</p>
                <p className="dashboard-title-sub mb-0 d-none d-md-block">
                  Consultez et téléchargez vos factures
                </p>
              </div>
            </div>
          </div>

          <div className="p-3">
            {error && (
              <div className="alert alert-danger">
                {error}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setError(null)}
                ></button>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-5">
                <i className="ri-file-list-3-line fs-1 text-muted mb-3 d-block"></i>
                <h5>Aucune facture</h5>
                <p className="text-muted">
                  Vos factures apparaîtront ici après votre premier paiement.
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-end">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="fw-500">
                            #{invoice.id}
                          </TableCell>
                          <TableCell>{formatDate(invoice.paidAt)}</TableCell>
                          <TableCell className="fw-500">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-end">
                            {invoice.pdfUrl && (
                              <a
                                href={invoice.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="ri-download-line me-1"></i>
                                PDF
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <i className="ri-arrow-left-line"></i>
                    </Button>
                    <span className="d-flex align-items-center px-3">
                      Page {page} sur {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <i className="ri-arrow-right-line"></i>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
