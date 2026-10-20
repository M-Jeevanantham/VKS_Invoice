import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { InvoiceForm } from './components/invoices/InvoiceForm';
import { InvoiceHistory } from './components/invoices/InvoiceHistory';
import { InvoiceDetailsModal } from './components/invoices/InvoiceDetailsModal';
import { CustomerList } from './components/customers/CustomerList';
import { ProductList } from './components/products/ProductList';
import { PaymentTracker } from './components/payments/PaymentTracker';
import { ReportsView } from './components/reports/ReportsView';
import { BusinessSettingsView } from './components/settings/BusinessSettingsView';
import { InvoicePrint } from './components/print/InvoicePrint';
import { LoginView } from './components/auth/LoginView';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';

import { dataService } from './services/dataService';
import { isSupabaseConfigured } from './services/supabase';
import {
  Invoice,
  Customer,
  Product,
  Payment,
  BusinessSettings,
  AuthSession,
} from './types';

import { exportInvoiceToPdf } from './utils/pdfExport';

export function App() {
  // Auth state
  const [session, setSession] = useState<AuthSession | null>(() => dataService.getCurrentSession());
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Data states
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active / selected invoice for viewing or editing
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [paymentPreselectedInvoice, setPaymentPreselectedInvoice] = useState<Invoice | null>(null);

  // Fetch all initial data
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Clean legacy mock records from localStorage if present
      try {
        const storedCust = localStorage.getItem('vks_customers');
        if (storedCust && storedCust.includes('00000000-0000-0000-0001')) {
          localStorage.removeItem('vks_customers');
        }
        const storedProd = localStorage.getItem('vks_products');
        if (storedProd && storedProd.includes('00000000-0000-0000-0002')) {
          localStorage.removeItem('vks_products');
        }
      } catch {
        // ignore localStorage errors
      }

      const [s, c, p, inv, pay] = await Promise.all([
        dataService.getBusinessSettings(),
        dataService.getCustomers(),
        dataService.getProducts(),
        dataService.getInvoices(),
        dataService.getPayments(),
      ]);

      setSettings(s);
      setCustomers(c);
      setProducts(p);
      setInvoices(inv);
      setPayments(pay);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------------------------------------------------------------------------
  // INVOICE ACTIONS
  // --------------------------------------------------------------------------
  const handleSaveDraft = async (invoiceData: Partial<Invoice>, openPreview: boolean = true): Promise<Invoice> => {
    const saved = await dataService.saveDraftInvoice(invoiceData);
    await loadData();
    if (openPreview) {
      setViewingInvoice(saved);
    }
    return saved;
  };

  const handleFinalizeInvoice = async (invoiceId: string): Promise<Invoice> => {
    const finalized = await dataService.finalizeInvoice(invoiceId);
    await loadData();
    setEditingInvoice(null);
    setCurrentTab('invoice-history');
    setViewingInvoice(finalized);
    setActionSuccessToast(`Invoice ${finalized.invoice_number} finalized & allocated successfully!`);
    setTimeout(() => setActionSuccessToast(null), 6000);
    return finalized;
  };

  const handleDuplicateInvoice = async (invoiceId: string) => {
    const duplicated = await dataService.duplicateInvoice(invoiceId);
    await loadData();
    setEditingInvoice(duplicated);
    setCurrentTab('create-invoice');
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    const label = inv?.invoice_number ? `invoice ${inv.invoice_number}` : 'this draft invoice';
    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE ${label}?\n\nThis will remove the invoice record from the system.`)) {
      await dataService.deleteInvoice(invoiceId);
      await loadData();
      if (viewingInvoice?.id === invoiceId) setViewingInvoice(null);
      setActionSuccessToast(`Permanently deleted ${label}.`);
      setTimeout(() => setActionSuccessToast(null), 5000);
    }
  };

  // --------------------------------------------------------------------------
  // PRINT & PDF DOWNLOAD
  // --------------------------------------------------------------------------
  const handlePrint = (invoice: Invoice) => {
    setPrintingInvoice(invoice);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingInvoice(null), 1000);
    }, 200);
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      setIsExportingPdf(true);
      setPrintingInvoice(invoice);

      // Allow DOM to update and render the 210mm print container
      await new Promise((resolve) => setTimeout(resolve, 300));

      const modalRoot = document.querySelector<HTMLElement>('.modal-backdrop #invoice-print-root, [role="dialog"] #invoice-print-root, #invoice-print-root');
      const savedFileName = await exportInvoiceToPdf(invoice, modalRoot);
      setDownloadSuccessToast(savedFileName);
      setTimeout(() => setDownloadSuccessToast(null), 6000);
    } catch (err: any) {
      console.error('PDF export error, falling back to print dialog:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
      setPrintingInvoice(null);
    }
  };

  // --------------------------------------------------------------------------
  // AUTHENTICATION & SECURITY HANDLERS
  // --------------------------------------------------------------------------
  const handleLogout = () => {
    dataService.logout();
    setSession(null);
  };

  const handleChangePassword = async (email: string, currentPass: string, newPass: string) => {
    return await dataService.changePassword(email, currentPass, newPass);
  };

  // --------------------------------------------------------------------------
  // CUSTOMER & PRODUCT HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveCustomer = async (cust: Partial<Customer>) => {
    if (cust.id) {
      await dataService.updateCustomer(cust.id, cust);
    } else {
      await dataService.createCustomer(cust as any);
    }
    await loadData();
  };

  const handleDeleteCustomer = async (id: string) => {
    await dataService.deleteCustomer(id);
    await loadData();
  };

  const handleSaveProduct = async (prod: Partial<Product>) => {
    if (prod.id) {
      await dataService.updateProduct(prod.id, prod);
    } else {
      await dataService.createProduct(prod as any);
    }
    await loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    await dataService.deleteProduct(id);
    await loadData();
  };

  const handleRecordPayment = async (paymentData: Omit<Payment, 'id' | 'created_at'>) => {
    await dataService.recordPayment(paymentData);
    await loadData();
  };

  const handleSaveSettings = async (newSettings: Partial<BusinessSettings>) => {
    await dataService.updateBusinessSettings(newSettings);
    await loadData();
  };

  const handleUploadMedia = async (file: File, folder: 'logos' | 'signatures' | 'murugan' | 'qr') => {
    return await dataService.uploadMediaFile(file, folder);
  };

  if (!session) {
    return (
      <LoginView
        isLiveSupabase={isSupabaseConfigured}
        onLogin={(email, pass) => dataService.login(email, pass)}
        onLoginSuccess={(newSession) => setSession(newSession)}
      />
    );
  }

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-[#FAF6F5] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 border-3 border-[#702C3B] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold uppercase tracking-widest text-[#702C3B] font-serif">
          V.K.S. Weaving Centre
        </span>
        <span className="text-[11px] text-[#6C5D64]">Initializing commercial database...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F5] text-[#30252A] flex">
      {/* 1. Left Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'create-invoice') setEditingInvoice(null);
          setCurrentTab(tab);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isLiveSupabase={isSupabaseConfigured}
        logoUrl={settings?.logo_url || '/vks-logo.png'}
      />

      {/* 2. Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          if (tab === 'create-invoice') setEditingInvoice(null);
          setCurrentTab(tab);
        }}
        collapsed={sidebarCollapsed}
        isLiveSupabase={isSupabaseConfigured}
        searchQuery={globalSearch}
        onSearchChange={setGlobalSearch}
        currentUser={session.user}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* 3. Main Workspace Content Area */}
      <main
        className={`flex-1 transition-all duration-200 mt-16 p-6 overflow-x-hidden ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* TAB: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <Dashboard
              invoices={invoices}
              payments={payments}
              onNavigate={(tab) => {
                if (tab === 'create-invoice') setEditingInvoice(null);
                setCurrentTab(tab);
              }}
              onViewInvoice={(inv) => setViewingInvoice(inv)}
            />
          )}

          {/* TAB: CREATE / EDIT INVOICE */}
          {currentTab === 'create-invoice' && (
            <InvoiceForm
              initialInvoice={editingInvoice}
              customers={customers}
              products={products}
              settings={settings}
              onSaveDraft={handleSaveDraft}
              onFinalize={handleFinalizeInvoice}
              onCancel={() => {
                setEditingInvoice(null);
                setCurrentTab('invoice-history');
              }}
              onPreview={(inv) => setViewingInvoice(inv)}
            />
          )}

          {/* TAB: INVOICE HISTORY */}
          {currentTab === 'invoice-history' && (
            <InvoiceHistory
              invoices={invoices}
              customers={customers}
              onViewInvoice={(inv) => setViewingInvoice(inv)}
              onEditDraft={(inv) => {
                setEditingInvoice(inv);
                setCurrentTab('create-invoice');
              }}
              onFinalize={handleFinalizeInvoice}
              onDuplicate={handleDuplicateInvoice}
              onDeleteDraft={handleDeleteInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onPrint={handlePrint}
              onDownloadPdf={handleDownloadPdf}
            />
          )}

          {/* TAB: CUSTOMERS */}
          {currentTab === 'customers' && (
            <CustomerList
              customers={customers}
              invoices={invoices}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onViewInvoice={(inv) => setViewingInvoice(inv)}
            />
          )}

          {/* TAB: PRODUCTS */}
          {currentTab === 'products' && (
            <ProductList
              products={products}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {/* TAB: PAYMENTS */}
          {currentTab === 'payments' && (
            <PaymentTracker
              payments={payments}
              invoices={invoices}
              onRecordPayment={handleRecordPayment}
              onViewInvoice={(inv) => setViewingInvoice(inv)}
              preselectedInvoice={paymentPreselectedInvoice}
              onClearPreselected={() => setPaymentPreselectedInvoice(null)}
            />
          )}

          {/* TAB: REPORTS */}
          {currentTab === 'reports' && (
            <ReportsView
              invoices={invoices}
              payments={payments}
              customers={customers}
            />
          )}

          {/* TAB: BUSINESS SETTINGS */}
          {currentTab === 'settings' && (
            <BusinessSettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onUploadMedia={handleUploadMedia}
              currentUser={session.user}
              onChangePassword={handleChangePassword}
            />
          )}
        </div>
      </main>

      {/* 4. Invoice Details & Full Preview Modal */}
      {viewingInvoice && (
        <InvoiceDetailsModal
          invoice={viewingInvoice}
          settings={settings}
          payments={payments}
          onClose={() => setViewingInvoice(null)}
          onEditDraft={(inv) => {
            setViewingInvoice(null);
            setEditingInvoice(inv);
            setCurrentTab('create-invoice');
          }}
          onFinalize={handleFinalizeInvoice}
          onDeleteInvoice={(id) => {
            setViewingInvoice(null);
            handleDeleteInvoice(id);
          }}
          onDuplicate={(id) => {
            setViewingInvoice(null);
            handleDuplicateInvoice(id);
          }}
          onRecordPayment={(inv) => {
            setViewingInvoice(null);
            setPaymentPreselectedInvoice(inv);
            setCurrentTab('payments');
          }}
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
        />
      )}

      {/* 5. Change Password Modal (Triggerable from Header avatar or settings) */}
      {isChangePasswordOpen && session && (
        <ChangePasswordModal
          user={session.user}
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          onChangePassword={handleChangePassword}
        />
      )}

      {/* 6. Print & PDF Generation Root (rendered on 210mm width so html2canvas captures full A4 resolution) */}
      <div
        id="vks-offscreen-print-container"
        className="fixed -left-[99999px] -top-[99999px] pointer-events-none print:static print:left-0 print:top-0 print:pointer-events-auto print:z-[9999] print:block"
        style={{
          width: '794px',
          minHeight: '1123px',
        }}
      >
        {printingInvoice && (
          <InvoicePrint invoice={printingInvoice} settings={settings} />
        )}
      </div>

      {/* PDF Export Floating Notification */}
      {isExportingPdf && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#702C3B] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 text-xs font-semibold animate-pulse border border-[#D4AE77]">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Generating Grayscale A4 PDF...</span>
        </div>
      )}

      {/* PDF Download Success Banner */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E7B54] text-white px-5 py-3.5 rounded-lg shadow-xl flex flex-col gap-1 text-xs border border-[#C1E6D6] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 font-bold">
            <span className="text-sm">✓</span>
            <span>Downloaded: {downloadSuccessToast}</span>
          </div>
          <span className="text-[11px] text-[#D8EFE5] pl-5">
            File is saved to your computer Downloads folder as a genuine PDF (.pdf)
          </span>
        </div>
      )}

      {/* Action / Finalization Success Banner */}
      {actionSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#702C3B] text-white px-5 py-3.5 rounded-lg shadow-xl flex flex-col gap-1 text-xs border border-[#D4AE77] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 font-bold text-sm text-[#F7DEB8]">
            <span>✓</span>
            <span>{actionSuccessToast}</span>
          </div>
          <span className="text-[11px] text-white/90 pl-5">
            The bill number is officially registered and archived in your Invoice Register.
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
