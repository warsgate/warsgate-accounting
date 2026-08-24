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

import { AccountingDocument, DocumentType, DocumentStatus, Contact, ProductService, CompanyProfile } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Persistent State from LocalStorage or Initial Files
  const [company, setCompany] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('warsgate_company');
    return saved ? JSON.parse(saved) : initialCompanyProfile;
  });

  const [documents, setDocuments] = useState<AccountingDocument[]>(() => {
    const saved = localStorage.getItem('warsgate_documents');
    return saved ? JSON.parse(saved) : initialDocuments;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('warsgate_contacts');
    return saved ? JSON.parse(saved) : initialContacts;
  });

  const [products, setProducts] = useState<ProductService[]>(() => {
    const saved = localStorage.getItem('warsgate_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [chartOfAccounts] = useState(initialChartOfAccounts);
  const [journalEntries] = useState(initialJournalEntries);
  const [bankAccounts] = useState(initialBankAccounts);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('warsgate_company', JSON.stringify(company));
  }, [company]);

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

  // Actions
  const handleSaveDocument = (doc: AccountingDocument) => {
    setDocuments(prev => {
      const exists = prev.some(d => d.id === doc.id);
      if (exists) {
        return prev.map(d => d.id === doc.id ? doc : d);
      }
      return [doc, ...prev];
    });
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const handleUpdateDocumentStatus = (docId: string, newStatus: DocumentStatus) => {
    const updated = documents.map(d => d.id === docId ? { ...d, status: newStatus } : d);
    setDocuments(updated);
  };

  const handleAddContact = (newContact: Contact) => {
    const updated = [newContact, ...contacts];
    setContacts(updated);
  };

  const handleUpdateContact = (updated: Contact) => {
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const handleAddProduct = (newProduct: ProductService) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleUpdateProduct = (updated: ProductService) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Navbar Header */}
      <Navbar
        company={company}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCreateModal={(type) => setCreateDocType(type)}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar Navigation */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                documents={documents}
                bankAccounts={bankAccounts}
                contacts={contacts}
                setActiveTab={setActiveTab}
                openCreateModal={(type) => setCreateDocType(type)}
                openViewDocument={(doc) => setViewDoc(doc)}
              />
            )}

            {activeTab === 'sales' && (
              <SalesView
                documents={documents}
                openCreateModal={(type) => setCreateDocType(type)}
                openEditDocument={(doc) => setEditingDoc(doc)}
                openViewDocument={(doc) => setViewDoc(doc)}
                onUpdateStatus={handleUpdateDocumentStatus}
                onDeleteDocument={handleDeleteDocument}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseView
                documents={documents}
                openCreateModal={(type) => setCreateDocType(type)}
                openEditDocument={(doc) => setEditingDoc(doc)}
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
        />
      )}

      {/* Create / Edit Document Modal */}
      {(createDocType || editingDoc) && (
        <CreateDocumentModal
          type={editingDoc ? editingDoc.type : createDocType!}
          initialDocument={editingDoc}
          contacts={contacts}
          products={products}
          onClose={() => {
            setCreateDocType(null);
            setEditingDoc(null);
          }}
          onSubmit={(doc) => {
            handleSaveDocument(doc);
            setCreateDocType(null);
            setEditingDoc(null);
          }}
        />
      )}

    </div>
  );
}

export default App;
