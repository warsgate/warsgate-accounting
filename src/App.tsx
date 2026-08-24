import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { SalesView } from './components/Sales/SalesView';
import { ExpenseView } from './components/Expense/ExpenseView';
import { ContactsView } from './components/Contacts/ContactsView';
import { InventoryView } from './components/Inventory/InventoryView';
import { AccountingView } from './components/Accounting/AccountingView';
import { TaxView } from './components/Tax/TaxView';
import { SettingsView } from './components/Settings/SettingsView';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { CreateDocumentModal } from './components/CreateDocumentModal';

import { 
  initialCompanyProfile, 
  initialDocuments, 
  initialContacts, 
  initialProducts, 
  initialChartOfAccounts, 
  initialJournalEntries, 
  initialBankAccounts 
} from './data/initialData';

import { AccountingDocument, DocumentType, DocumentStatus, Contact, ProductService, CompanyProfile, DocumentNumberingConfig } from './types';
import { defaultNumberingConfig } from './utils/numbering';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Persistent State from LocalStorage or Initial Files
  const [company, setCompany] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('warsgate_company');
    return saved ? JSON.parse(saved) : initialCompanyProfile;
  });

  const [numberingConfig, setNumberingConfig] = useState<DocumentNumberingConfig>(() => {
    const saved = localStorage.getItem('warsgate_doc_numbering');
    return saved ? JSON.parse(saved) : defaultNumberingConfig;
  });

  const [documents, setDocuments] = useState<AccountingDocument[]>(() => {
    const saved = localStorage.getItem('warsgate_documents');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialDocuments;
      }
    }
    return initialDocuments;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('warsgate_contacts');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialContacts;
      }
    }
    return initialContacts;
  });

  const [products, setProducts] = useState<ProductService[]>(() => {
    const saved = localStorage.getItem('warsgate_products');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialProducts;
      }
    }
    return initialProducts;
  });

  const [chartOfAccounts] = useState(initialChartOfAccounts);
  const [journalEntries] = useState(initialJournalEntries);
  const [bankAccounts] = useState(initialBankAccounts);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('warsgate_company', JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem('warsgate_doc_numbering', JSON.stringify(numberingConfig));
  }, [numberingConfig]);

  useEffect(() => {
    localStorage.setItem('warsgate_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('warsgate_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('warsgate_products', JSON.stringify(products));
  }, [products]);

  // Modal States
  const [viewDoc, setViewDoc] = useState<AccountingDocument | null>(null);
  const [createDocType, setCreateDocType] = useState<DocumentType | null>(null);
  const [editingDoc, setEditingDoc] = useState<AccountingDocument | null>(null);
  const [fromDoc, setFromDoc] = useState<AccountingDocument | null>(null);

  const handleIssueReceiptFromInvoice = (invoiceDoc: AccountingDocument) => {
    setFromDoc(invoiceDoc);
    setCreateDocType('RECEIPT');
    setEditingDoc(null);
    setViewDoc(null);
  };

  // Actions
  const handleSaveDocument = (doc: AccountingDocument) => {
    setDocuments(prev => {
      const exists = prev.some(d => d.id === doc.id);
      const updated = exists ? prev.map(d => d.id === doc.id ? doc : d) : [doc, ...prev];
      localStorage.setItem('warsgate_documents', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => {
      const updated = prev.filter(d => d.id !== docId);
      localStorage.setItem('warsgate_documents', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateDocumentStatus = (docId: string, newStatus: DocumentStatus) => {
    setDocuments(prev => {
      const updated = prev.map(d => d.id === docId ? { ...d, status: newStatus } : d);
      localStorage.setItem('warsgate_documents', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddContact = (newContact: Contact) => {
    setContacts(prev => {
      const updated = [newContact, ...prev];
      localStorage.setItem('warsgate_contacts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateContact = (updated: Contact) => {
    setContacts(prev => {
      const next = prev.map(c => c.id === updated.id ? updated : c);
      localStorage.setItem('warsgate_contacts', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('warsgate_contacts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddProduct = (newProduct: ProductService) => {
    setProducts(prev => {
      const updated = [newProduct, ...prev];
      localStorage.setItem('warsgate_products', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateProduct = (updated: ProductService) => {
    setProducts(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      localStorage.setItem('warsgate_products', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('warsgate_products', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Navbar Header */}
      <Navbar
        company={company}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCreateModal={(type) => {
          setFromDoc(null);
          setEditingDoc(null);
          setCreateDocType(type);
        }}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          documents={documents}
          contacts={contacts}
          products={products}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                documents={documents}
                bankAccounts={bankAccounts}
                contacts={contacts}
                setActiveTab={setActiveTab}
                openCreateModal={(type) => {
                  setFromDoc(null);
                  setEditingDoc(null);
                  setCreateDocType(type);
                }}
                openViewDocument={(doc) => setViewDoc(doc)}
              />
            )}

            {activeTab === 'sales' && (
              <SalesView
                documents={documents}
                openCreateModal={(type) => {
                  setFromDoc(null);
                  setEditingDoc(null);
                  setCreateDocType(type);
                }}
                openEditDocument={(doc) => {
                  setFromDoc(null);
                  setEditingDoc(doc);
                }}
                openViewDocument={(doc) => setViewDoc(doc)}
                onIssueReceipt={handleIssueReceiptFromInvoice}
                onUpdateStatus={handleUpdateDocumentStatus}
                onDeleteDocument={handleDeleteDocument}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseView
                documents={documents}
                openCreateModal={(type) => {
                  setFromDoc(null);
                  setEditingDoc(null);
                  setCreateDocType(type);
                }}
                openEditDocument={(doc) => {
                  setFromDoc(null);
                  setEditingDoc(doc);
                }}
                openViewDocument={(doc) => setViewDoc(doc)}
                onUpdateStatus={handleUpdateDocumentStatus}
                onDeleteDocument={handleDeleteDocument}
              />
            )}

            {activeTab === 'contacts' && (
              <ContactsView
                contacts={contacts}
                onAddContact={handleAddContact}
                onUpdateContact={handleUpdateContact}
                onDeleteContact={handleDeleteContact}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {activeTab === 'accounting' && (
              <AccountingView
                chartOfAccounts={chartOfAccounts}
                journalEntries={journalEntries}
              />
            )}

            {activeTab === 'tax' && (
              <TaxView
                documents={documents}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                company={company}
                onUpdateCompany={(updated) => setCompany(updated)}
                numberingConfig={numberingConfig}
                onUpdateNumberingConfig={(cfg) => setNumberingConfig(cfg)}
              />
            )}
          </div>
        </main>

      </div>

      {/* Printable Document Preview Modal */}
      {viewDoc && (
        <DocumentViewerModal
          document={viewDoc}
          company={company}
          onClose={() => setViewDoc(null)}
          onIssueReceipt={handleIssueReceiptFromInvoice}
        />
      )}

      {/* Create / Edit Document Modal */}
      {(createDocType || editingDoc || fromDoc) && (
        <CreateDocumentModal
          type={editingDoc ? editingDoc.type : (createDocType || 'RECEIPT')}
          initialDocument={editingDoc}
          fromDocument={fromDoc}
          documents={documents}
          numberingConfig={numberingConfig}
          contacts={contacts}
          products={products}
          onClose={() => {
            setCreateDocType(null);
            setEditingDoc(null);
            setFromDoc(null);
          }}
          onSubmit={(doc) => {
            handleSaveDocument(doc);
            setCreateDocType(null);
            setEditingDoc(null);
            setFromDoc(null);
          }}
        />
      )}

    </div>
  );
}

export default App;
