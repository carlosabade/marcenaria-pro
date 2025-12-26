
export enum ExpenseCategory {
  MATERIAL = 'Material',
  COMBUSTIVEL = 'Combustível',
  ALIMENTACAO = 'Alimentação',
  FERRAMENTA = 'Ferramenta',
  OUTROS = 'Outros'
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
}

export interface DailyExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  projectId?: string;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  location?: string;
  notes?: string;
  notified?: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  cpf?: string;
  notes?: string;
}

export interface MaterialBreakdown {
  mdfMadeirado: number;
  mdfBranco15: number;
  mdfBranco6: number;
  corredicas: number;
  dobradicas: number;
  colaContato: number;
  colaInstantanea: number;
  parafusos: number;
  fitaBorda: number;
  outros: number;
}

export interface ProjectFeedback {
  id: string;
  date: string;
  message: string;
  type: 'client' | 'internal';
}

export type ModuleType = 'kitchen_base' | 'kitchen_upper' | 'wardrobe' | 'generic';

export interface CabinetModule {
  id: string;
  type: ModuleType;
  name: string;
  height: number;
  width: number;
  depth: number;
  hasBackPanel: boolean;
  isMadeirado: boolean;
  drawersQty: number;
  drawerHeight?: number;
  doorsQty: number;
  doorType: 'hinge' | 'sliding' | 'lift';
  isGlassDoor: boolean;
  shelvesQty: number;
  partitionsQty: number;
  handlesQty: number;
  handleType: 'external' | 'profile' | 'integrated' | 'touch';
  calculatedMdf15Area: number;
  calculatedMdf6Area: number;
  calculatedHinges: number;
  calculatedSlides: number;
  estimatedCost: number;
}

export interface MaterialPrices {
  sheetPrice15mm: number;
  sheetPriceMadeirado: number;
  sheetPrice6mm: number;
  sheetArea: number;
  hingePrice: number;
  slidePrice: number;
  handlePrice: number;
}

export interface ContractClause {
  id: string;
  title: string;
  text: string;
  editable: boolean;
}

export interface ProjectVideo {
  id: string;
  title: string;
  url: string;
  embedUrl: string;
  date: string;
}

export interface Project {
  id: string;
  clientName: string;
  clientCpf?: string;
  clientAddress?: string;
  clientCity?: string;
  projectType: string;
  contractDescription?: string;
  paymentTerms?: string;
  clientSignature?: string;
  startDate: string;
  deadline: string;
  deadlineNotified?: boolean;
  status: 'active' | 'completed' | 'quote' | 'pending_approval' | 'approved' | 'rejected';
  public_token?: string;
  approved_at?: string;
  rejection_reason?: string;
  client_view_count?: number;
  materialsCost: number;
  finalPrice?: number; // Snapshot of the calculated price for public view
  materialsBreakdown?: MaterialBreakdown;
  estimatedHours: number;
  estimatedDays?: number;
  productionDays?: number;
  assemblyDays?: number;
  freightCost?: number;
  marginPercent: number;
  taxPercent: number;
  carpenterPercent?: number;
  notes?: string;
  feedbacks?: ProjectFeedback[];
  modules?: CabinetModule[];
  videos?: ProjectVideo[];
  customClauses?: ContractClause[]; // Cláusulas específicas deste projeto
}

export interface AppSettings {
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  hourlyRate: number;
  materialPrices: MaterialPrices;
  googleApiKey?: string;
  style?: string;
}

export interface CompanyProfile {
  name: string;
  cnpj: string;
  address: string;
  contact: string;
  logo?: string;
  signature?: string;
  defaultPaymentTerms?: string;
  contractTemplate?: ContractClause[]; // Modelo padrão de contrato da oficina
  // Phase 2: Customer Portal Branding
  company_name?: string; // Display name for portal (can be different from legal name)
  company_logo_url?: string;
  company_phone?: string;
  company_address?: string;
  company_email?: string;
  company_website?: string;
  company_color_primary?: string;
  contract_terms?: string;
}

export type SubscriptionPlan = 'free' | 'monthly' | 'lifetime';

export interface DeviceInfo {
  id: string;
  name: string;
  lastAccess: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  document?: string;
  plan: SubscriptionPlan;
  subscriptionDate?: string;
  downloadCount: number;
  devices: DeviceInfo[];
  role?: 'admin' | 'user';
}
