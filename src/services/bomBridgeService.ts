import { BomProject, BomPart } from '../types';

const BOM_API_STORAGE_KEY = 'warsgate_bom_api_url';
const DEFAULT_API_URLS = [
  'http://localhost:5000/api',
  'http://localhost:5001/api',
  'https://warsgate-bom-api.onrender.com/api'
];

// ─── Offline Fallback BOM Data (Realistic Warsgate Projects) ───
export const FALLBACK_BOM_PROJECTS: BomProject[] = [
  {
    id: 'proj-527',
    code: 'PRJ-527',
    name: 'Tracking ability Line ADC',
    customer: 'บริษัท ชินเอทสึ โพลีเมอร์ (ประเทศไทย) จำกัด',
    customerId: '001',
    dwgNo: 'ADC-2608-001',
    targetBudget: 850000,
    status: 'Active',
    totalPartsCount: 16,
    totalEstimatedCost: 846340,
    suppliers: ['OMRON', 'SMC', 'Misumi', 'Warsgate'],
    parts: [
      {
        id: 'p-527-01',
        projectId: 'proj-527',
        itemNo: 1,
        dwgNo: 'ADC-2608-001-01',
        partName: 'PLC Control Board (Ethernet IP)',
        typeSpec: 'CJ1W-EIP21',
        category: 'EE',
        partType: 'Standard Part',
        qty: 21,
        unit: 'EA',
        maker: 'OMRON',
        supplier: 'Omron Dealer',
        targetUnitPrice: 35040,
        unitPrice: 35040,
        totalAmount: 735840,
        poNumber: 'PO-2607001',
        status: 'Ordered',
        remarks: 'Part: CJ1W-EIP21 | Brand: OMRON (Line ADC)'
      },
      {
        id: 'p-527-02',
        projectId: 'proj-527',
        itemNo: 2,
        dwgNo: 'ADC-2608-001-02A',
        partName: 'PLC POWER SUPPLY UNIT',
        typeSpec: 'CJ1W-PA202',
        category: 'EE',
        partType: 'Standard Part',
        qty: 6,
        unit: 'EA',
        maker: 'OMRON',
        supplier: 'Omron Dealer',
        targetUnitPrice: 6500,
        unitPrice: 6500,
        totalAmount: 39000,
        poNumber: 'PO-2607001',
        status: 'Planned',
        remarks: 'Sub PLC Box item 2.1'
      },
      {
        id: 'p-527-03',
        projectId: 'proj-527',
        itemNo: 3,
        dwgNo: 'ADC-2608-001-02B',
        partName: 'MODULE LINK RACK UNIT',
        typeSpec: 'CJ1W-IC101',
        category: 'EE',
        partType: 'Standard Part',
        qty: 6,
        unit: 'EA',
        maker: 'OMRON',
        supplier: 'Omron Dealer',
        targetUnitPrice: 8500,
        unitPrice: 8500,
        totalAmount: 51000,
        poNumber: 'PO-2607001',
        status: 'Planned',
        remarks: 'Sub PLC Box item 2.2'
      },
      {
        id: 'p-527-04',
        projectId: 'proj-527',
        itemNo: 4,
        dwgNo: 'ADC-2608-001-02C',
        partName: 'MODULE LINK RACK UNIT',
        typeSpec: 'CJ1W-II101',
        category: 'EE',
        partType: 'Standard Part',
        qty: 6,
        unit: 'EA',
        maker: 'OMRON',
        supplier: 'Omron Dealer',
        targetUnitPrice: 8500,
        unitPrice: 8500,
        totalAmount: 51000,
        poNumber: 'PO-2607001',
        status: 'Planned',
        remarks: 'Sub PLC Box item 2.3'
      },
      {
        id: 'p-527-05',
        projectId: 'proj-527',
        itemNo: 5,
        dwgNo: 'ADC-2608-001-02D',
        partName: 'CABLE LINK RACK',
        typeSpec: 'CS1W-CN223 2M',
        category: 'EE',
        partType: 'Standard Part',
        qty: 6,
        unit: 'EA',
        maker: 'OMRON',
        supplier: 'Omron Dealer',
        targetUnitPrice: 2500,
        unitPrice: 2500,
        totalAmount: 15000,
        poNumber: 'PO-2607001',
        status: 'Planned',
        remarks: 'Sub PLC Box item 2.4'
      }
    ]
  },
  {
    id: 'proj-smartcam',
    code: 'PRJ-2609-002',
    name: 'Smart Camera Pick & Place / MVC with Camera 12 MP Inspection Parts',
    customer: 'บริษัท คูโรดา เทคโน ทูลลิง แมชชีน (ไทยแลนด์) จํากัด',
    customerId: '002',
    dwgNo: 'WGL-MVC-2026',
    targetBudget: 1100000,
    status: 'Active',
    totalPartsCount: 13,
    totalEstimatedCost: 1004354,
    suppliers: ['Wenglor', 'Warsgate'],
    parts: [
      {
        id: 'p-sc-01',
        projectId: 'proj-smartcam',
        itemNo: 1,
        dwgNo: 'MVCA101',
        partName: 'Machine Vision Controller uniVision AI',
        typeSpec: 'Controller ประมวลผลภาพอัจฉริยะ',
        category: 'VISION',
        partType: 'Standard Part',
        qty: 1,
        unit: 'pcs',
        maker: 'Wenglor',
        supplier: 'Wenglor Sensoric GmbH',
        targetUnitPrice: 247520,
        unitPrice: 247520,
        totalAmount: 247520,
        status: 'Approved',
        remarks: 'Vision Controller unit'
      },
      {
        id: 'p-sc-02',
        projectId: 'proj-smartcam',
        itemNo: 2,
        dwgNo: 'BBVK005',
        partName: 'Machine Vision Camera (12.3 MP Inspection with AI)',
        typeSpec: '12.3 MP Inspection AI Camera',
        category: 'VISION',
        partType: 'Standard Part',
        qty: 1,
        unit: 'pcs',
        maker: 'Wenglor',
        supplier: 'Wenglor Sensoric GmbH',
        targetUnitPrice: 235040,
        unitPrice: 235040,
        totalAmount: 235040,
        status: 'Approved',
        remarks: 'Inspection Camera'
      },
      {
        id: 'p-sc-03',
        projectId: 'proj-smartcam',
        itemNo: 3,
        dwgNo: 'B60E101',
        partName: 'Smart Camera uniVision Extended',
        typeSpec: '1.6 MP Auto-Focus Integrated Vision',
        category: 'VISION',
        partType: 'Standard Part',
        qty: 1,
        unit: 'pcs',
        maker: 'Wenglor',
        supplier: 'Wenglor Sensoric GmbH',
        targetUnitPrice: 358800,
        unitPrice: 358800,
        totalAmount: 358800,
        status: 'Approved',
        remarks: 'Smart Camera'
      },
      {
        id: 'p-sc-04',
        projectId: 'proj-smartcam',
        itemNo: 4,
        dwgNo: 'ZVZG303',
        partName: 'High-Resolution Lens for Smart Camera',
        typeSpec: 'High-Resolution C-Mount Lens',
        category: 'OPTIC',
        partType: 'Standard Part',
        qty: 1,
        unit: 'pcs',
        maker: 'Wenglor',
        supplier: 'Wenglor Sensoric GmbH',
        targetUnitPrice: 46280,
        unitPrice: 46280,
        totalAmount: 46280,
        status: 'Approved',
        remarks: 'Camera Lens'
      },
      {
        id: 'p-sc-05',
        projectId: 'proj-smartcam',
        itemNo: 5,
        dwgNo: 'LMDX202',
        partName: 'Dome Light white-infrared light 130 mm',
        typeSpec: 'Dome Light 130 mm',
        category: 'LIGHT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'pcs',
        maker: 'Wenglor',
        supplier: 'Wenglor Sensoric GmbH',
        targetUnitPrice: 37440,
        unitPrice: 37440,
        totalAmount: 37440,
        status: 'Approved',
        remarks: 'Illumination'
      }
    ]
  },
  {
    id: 'proj-dashboard',
    code: 'PRJ-2609-004',
    name: 'งานระบบ Dashboard Data Monitor (Hardware & Network)',
    customer: 'บริษัท คูโรดา เทคโน ทูลลิง แมชชีน (ไทยแลนด์) จํากัด',
    customerId: '002',
    dwgNo: 'DBM-2026-01',
    targetBudget: 60000,
    status: 'Active',
    totalPartsCount: 4,
    totalEstimatedCost: 47190,
    suppliers: ['Dell', 'Samsung/LG', 'Logitech', 'APC/Syndome'],
    parts: [
      {
        id: 'p-db-01',
        projectId: 'proj-dashboard',
        itemNo: 1,
        dwgNo: 'COMP-DELL-5090',
        partName: 'ชุดคอมพิวเตอร์ Dell OptiPlex 5090 SFF',
        typeSpec: 'Core i7-10700, RAM 16GB, SSD 256GB + HDD 1TB, Win11 Pro',
        category: 'IT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'ชุด',
        maker: 'Dell',
        supplier: 'IT City / Advice',
        targetUnitPrice: 35000,
        unitPrice: 35000,
        totalAmount: 35000,
        status: 'Approved',
        remarks: 'Industrial Data Logger Host'
      },
      {
        id: 'p-db-02',
        projectId: 'proj-dashboard',
        itemNo: 2,
        dwgNo: 'MON-LED-24FHD',
        partName: 'จอแสดงผล Dashboard LED Monitor 24 นิ้ว (Full HD)',
        typeSpec: 'IPS 24" 1920x1080 FHD 24/7 Support',
        category: 'IT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'ชุด',
        maker: 'Dell / Samsung',
        supplier: 'IT Supplier',
        targetUnitPrice: 7800,
        unitPrice: 7800,
        totalAmount: 7800,
        status: 'Approved',
        remarks: 'Realtime Monitor'
      },
      {
        id: 'p-db-03',
        projectId: 'proj-dashboard',
        itemNo: 3,
        dwgNo: 'ACC-KBM-WL',
        partName: 'ชุดคีย์บอร์ดและเมาส์ไร้สาย (Wireless Keyboard & Mouse)',
        typeSpec: 'USB Nano Receiver 2.4GHz',
        category: 'IT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'ชุด',
        maker: 'Logitech',
        supplier: 'IT Supplier',
        targetUnitPrice: 890,
        unitPrice: 890,
        totalAmount: 890,
        status: 'Approved',
        remarks: 'Wireless KBM'
      },
      {
        id: 'p-db-04',
        projectId: 'proj-dashboard',
        itemNo: 4,
        dwgNo: 'UPS-800VA-480W',
        partName: 'เครื่องสำรองไฟอัตโนมัติ (UPS 800VA / 480W)',
        typeSpec: 'Surge Protection & AVR 800VA/480W',
        category: 'IT',
        partType: 'Standard Part',
        qty: 1,
        unit: 'เครื่อง',
        maker: 'Syndome / APC',
        supplier: 'IT Supplier',
        targetUnitPrice: 3500,
        unitPrice: 3500,
        totalAmount: 3500,
        status: 'Approved',
        remarks: 'UPS Backup Power'
      }
    ]
  },
  {
    id: 'proj-autopack',
    code: 'PRJ-107',
    name: 'Auto Packing LM1',
    customer: 'บริษัท ผลิตภัณฑ์คอนกรีตซีแพค จำกัด',
    customerId: '003',
    dwgNo: 'LM1-PKG-2026',
    targetBudget: 2450000,
    status: 'Active',
    totalPartsCount: 217,
    totalEstimatedCost: 1985000,
    suppliers: ['Misumi', 'SMC', 'Mitsubishi', 'Warsgate'],
    parts: []
  }
];

class BomBridgeService {
  private activeUrl: string | null = null;
  private isOnline: boolean = false;

  public getApiUrl(): string {
    const saved = localStorage.getItem(BOM_API_STORAGE_KEY);
    if (saved) return saved;
    return this.activeUrl || DEFAULT_API_URLS[0];
  }

  public setApiUrl(url: string) {
    localStorage.setItem(BOM_API_STORAGE_KEY, url);
    this.activeUrl = url;
  }

  // Check connection to BOM API
  public async checkConnection(): Promise<{ online: boolean; url: string; latency?: number }> {
    const customUrl = localStorage.getItem(BOM_API_STORAGE_KEY);
    const urlsToTry = customUrl ? [customUrl, ...DEFAULT_API_URLS] : DEFAULT_API_URLS;

    for (const url of urlsToTry) {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
        
        const res = await fetch(`${url}/integration/projects-with-bom`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          this.activeUrl = url;
          this.isOnline = true;
          return { online: true, url, latency: Date.now() - startTime };
        }
      } catch (err) {
        // Continue to try next url
      }
    }

    this.isOnline = false;
    return { online: false, url: this.getApiUrl() };
  }

  // Fetch all projects with BOM parts
  public async fetchProjects(): Promise<{ projects: BomProject[]; isOnline: boolean; source: string }> {
    const check = await this.checkConnection();
    
    if (check.online && this.activeUrl) {
      try {
        const res = await fetch(`${this.activeUrl}/integration/projects-with-bom`);
        if (res.ok) {
          const data: BomProject[] = await res.json();
          // Merge with fallback data for any missing projects
          const merged = [...data];
          for (const fb of FALLBACK_BOM_PROJECTS) {
            if (!merged.some(m => m.code === fb.code)) {
              merged.push(fb);
            }
          }
          return { projects: merged, isOnline: true, source: `Live BOM Server (${this.activeUrl})` };
        }
      } catch (err) {
        console.warn('Failed to parse live BOM data, using fallback cache:', err);
      }
    }

    return {
      projects: FALLBACK_BOM_PROJECTS,
      isOnline: false,
      source: 'ออฟไลน์แคช / ฐานข้อมูลตัวอย่างโครงการ Warsgate'
    };
  }

  // Fetch single project parts
  public async fetchProjectParts(projectId: string): Promise<BomPart[]> {
    if (this.isOnline && this.activeUrl) {
      try {
        const res = await fetch(`${this.activeUrl}/integration/projects/${projectId}/parts`);
        if (res.ok) {
          const data = await res.json();
          return data.parts || [];
        }
      } catch (err) {
        console.warn('Failed to fetch parts online, falling back:', err);
      }
    }

    const found = FALLBACK_BOM_PROJECTS.find(p => p.id === projectId || p.code === projectId);
    return found?.parts || [];
  }

  // Sync Quotation data back to BOM project
  public async syncQuotationToBom(projectId: string, payload: { quotationNo: string; customerPoNo?: string; grandTotal: number }) {
    if (this.isOnline && this.activeUrl) {
      try {
        const res = await fetch(`${this.activeUrl}/integration/sync-quotation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, ...payload })
        });
        return await res.json();
      } catch (err) {
        console.warn('Error syncing quotation to BOM:', err);
      }
    }
    return { success: true, mocked: true, message: 'Saved to local history' };
  }

  // Sync PO back to BOM parts (mark as ordered)
  public async syncPoToBom(partIds: string[], payload: { poNumber: string; supplier: string; orderDate?: string }) {
    if (this.isOnline && this.activeUrl) {
      try {
        const res = await fetch(`${this.activeUrl}/integration/sync-po`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partIds, ...payload })
        });
        return await res.json();
      } catch (err) {
        console.warn('Error syncing PO to BOM:', err);
      }
    }
    return { success: true, mocked: true, count: partIds.length };
  }
}

export const bomBridge = new BomBridgeService();
