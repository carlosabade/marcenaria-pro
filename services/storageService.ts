
import { FixedCost, DailyExpense, Project, AppSettings, CompanyProfile, UserProfile, SubscriptionPlan, Appointment, Client, DeviceInfo, ContractClause } from '../types';
import { sendNotification } from './notificationService';
import { supabase } from './supabaseClient';

const KEYS = {
    FIXED_COSTS: 'mp_fixed_costs',
    EXPENSES: 'mp_expenses',
    PROJECTS: 'mp_projects',
    SETTINGS: 'mp_settings',
    COMPANY: 'mp_company',
    USER: 'mp_user_auth',
    APPOINTMENTS: 'mp_appointments',
    CLIENTS: 'mp_clients',
    LAST_SYNC: 'mp_last_sync',
    DEVICE_ID: 'mp_device_unique_id'
};

const defaultContractTemplate: ContractClause[] = [
    {
        id: '1',
        title: 'CLÁUSULA PRIMEIRA - DO OBJETO',
        text: 'O presente contrato tem como objeto a fabricação e instalação de mobiliário sob medida conforme o seguinte detalhamento:\n{{DESCRICAO_ITENS}}',
        editable: true
    },
    {
        id: '2',
        title: 'CLÁUSULA SEGUNDA - DO PREÇO E FORMA DE PAGAMENTO',
        text: 'Pelo serviço ora contratado, o CONTRATANTE pagará à CONTRATADA o valor total de R$ {{VALOR_TOTAL}}.\nO pagamento será realizado da seguinte forma: {{FORMA_PAGAMENTO}}',
        editable: true
    },
    {
        id: '3',
        title: 'CLÁUSULA TERCEIRA - DO PRAZO DE ENTREGA',
        text: 'A CONTRATADA compromete-se a realizar a entrega e finalização da montagem até o dia {{DATA_ENTREGA}}, ressalvados atrasos decorrentes de força maior ou falta de acesso ao local de instalação.',
        editable: true
    },
    {
        id: '4',
        title: 'CLÁUSULA QUARTA - DA GARANTIA',
        text: 'A CONTRATADA oferece garantia de 01 (um) ano contra defeitos de fabricação e montagem, a contar da data de entrega, não cobrindo danos por mau uso, infiltrações ou exposição excessiva ao sol.',
        editable: true
    },
    {
        id: '5',
        title: 'CLÁUSULA QUINTA - DO FORO',
        text: 'Para dirimir quaisquer controvérsias oriundas do presente contrato, as partes elegem o foro da comarca de {{CIDADE_DATA}}.',
        editable: true
    }
];

const defaultSettings: AppSettings = {
    workingDaysPerMonth: 22,
    workingHoursPerDay: 8,
    hourlyRate: 0,
    materialPrices: {
        sheetPrice15mm: 280.00,
        sheetPriceMadeirado: 380.00,
        sheetPrice6mm: 150.00,
        sheetArea: 5.06,
        hingePrice: 5.00,
        slidePrice: 25.00,
        handlePrice: 15.00
    }
};

export const getDeviceId = (): string => {
    let id = localStorage.getItem(KEYS.DEVICE_ID);
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem(KEYS.DEVICE_ID, id);
    }
    return id;
};

export const getDeviceLimit = (plan: SubscriptionPlan): number => {
    switch (plan) {
        case 'lifetime': return 5;
        case 'monthly': return 1;
        default: return 1;
    }
};

export const syncToCloud = async (): Promise<{ success: boolean; message: string }> => {
    const user = getUser();
    if (!user) return { success: false, message: "Usuário não autenticado." };

    try {
        const projects = getProjects();
        const clients = getClients();
        const expenses = getExpenses();
        const fixedCosts = getFixedCosts();
        const appointments = getAppointments();
        const settings = getSettings();
        const company = getCompanyProfile();

        const deviceId = getDeviceId();
        const updatedDevices = [...(user.devices || [])];
        const deviceIdx = updatedDevices.findIndex(d => d.id === deviceId);
        const deviceName = navigator.userAgent.split(')')[0].split('(')[1] || 'Dispositivo Desconhecido';

        if (deviceIdx >= 0) {
            updatedDevices[deviceIdx].lastAccess = new Date().toISOString();
        } else {
            updatedDevices.push({ id: deviceId, name: deviceName, lastAccess: new Date().toISOString() });
        }

        const updatedUser = { ...user, devices: updatedDevices };
        saveUser(updatedUser);

        const promises = [];
        if (projects.length > 0) promises.push(supabase.from('projects').upsert(projects.map(p => ({ id: p.id, email: user.email, data: p }))));
        if (clients.length > 0) promises.push(supabase.from('clients').upsert(clients.map(c => ({ id: c.id, email: user.email, data: c }))));
        if (expenses.length > 0) promises.push(supabase.from('expenses').upsert(expenses.map(e => ({ id: e.id, email: user.email, data: e }))));
        if (fixedCosts.length > 0) promises.push(supabase.from('fixed_costs').upsert(fixedCosts.map(fc => ({ id: fc.id, email: user.email, data: fc }))));
        if (appointments.length > 0) promises.push(supabase.from('appointments').upsert(appointments.map(a => ({ id: a.id, email: user.email, data: a }))));

        promises.push(supabase.from('settings').upsert({ email: user.email, data: settings }));
        promises.push(supabase.from('company').upsert({ email: user.email, data: company }));
        promises.push(supabase.from('profiles').upsert({ email: user.email, data: updatedUser }));

        await Promise.all(promises);
        localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
        return { success: true, message: "Backup completo realizado na nuvem!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export const pullFromCloud = async (): Promise<{ success: boolean; message: string }> => {
    const user = getUser();
    if (!user) return { success: false, message: "Usuário não autenticado." };

    try {
        const { data: cloudProfile } = await supabase.from('profiles').select('data').eq('email', user.email).maybeSingle();

        if (cloudProfile?.data) {
            const remoteUser = cloudProfile.data as UserProfile;
            const deviceId = getDeviceId();
            const limit = getDeviceLimit(remoteUser.plan);
            const isDeviceLinked = remoteUser.devices?.some(d => d.id === deviceId);

            if (!isDeviceLinked && (remoteUser.devices?.length || 0) >= limit) {
                return { success: false, message: `Limite de dispositivos excedido. Remova um dispositivo nas configurações.` };
            }
            saveUser(remoteUser);
        }

        const [
            { data: cloudProjects },
            { data: cloudClients },
            { data: cloudExpenses },
            { data: cloudFixed },
            { data: cloudApps },
            { data: cloudSettings },
            { data: cloudCompany }
        ] = await Promise.all([
            supabase.from('projects').select('data').eq('email', user.email),
            supabase.from('clients').select('data').eq('email', user.email),
            supabase.from('expenses').select('data').eq('email', user.email),
            supabase.from('fixed_costs').select('data').eq('email', user.email),
            supabase.from('appointments').select('data').eq('email', user.email),
            supabase.from('settings').select('data').eq('email', user.email).maybeSingle(),
            supabase.from('company').select('data').eq('email', user.email).maybeSingle()
        ]);

        if (cloudProjects) saveProjects(cloudProjects.map(i => i.data));
        if (cloudClients) saveClients(cloudClients.map(i => i.data));
        if (cloudExpenses) saveExpenses(cloudExpenses.map(i => i.data));
        if (cloudFixed) saveFixedCosts(cloudFixed.map(i => i.data));
        if (cloudApps) saveAppointments(cloudApps.map(i => i.data));
        if (cloudSettings?.data) saveSettings(cloudSettings.data);
        if (cloudCompany?.data) saveCompanyProfile(cloudCompany.data);

        localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
        return { success: true, message: "Dados restaurados da nuvem com sucesso!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

const getItems = <T,>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(key);
    try { return data ? JSON.parse(data) : []; } catch { return []; }
};

const setItems = <T,>(key: string, items: T[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(items));
};

export const getFixedCosts = (): FixedCost[] => getItems<FixedCost>(KEYS.FIXED_COSTS);
export const saveFixedCosts = (costs: FixedCost[]) => setItems(KEYS.FIXED_COSTS, costs);

export const getExpenses = (): DailyExpense[] => getItems<DailyExpense>(KEYS.EXPENSES);
export const saveExpenses = (expenses: DailyExpense[]) => setItems(KEYS.EXPENSES, expenses);

// Fix: Added addExpense helper to properly update the local expenses storage
export const addExpense = (expense: DailyExpense) => {
    const all = getExpenses();
    all.unshift(expense);
    saveExpenses(all);
};

export const getAppointments = (): Appointment[] => {
    const apps = getItems<Appointment>(KEYS.APPOINTMENTS);
    return apps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
export const saveAppointments = (appointments: Appointment[]) => setItems(KEYS.APPOINTMENTS, appointments);
export const addAppointment = (appointment: Appointment) => {
    const all = getAppointments();
    saveAppointments([...all, { ...appointment, notified: false }]);
};
export const deleteAppointment = (id: string) => saveAppointments(getAppointments().filter(a => a.id !== id));

export const getClients = (): Client[] => getItems<Client>(KEYS.CLIENTS);
export const saveClients = (clients: Client[]) => setItems(KEYS.CLIENTS, clients);
export const updateClient = (client: Client) => {
    const all = getClients();
    const index = all.findIndex(c => c.id === client.id);
    if (index >= 0) all[index] = client; else all.unshift(client);
    saveClients(all);
};
export const deleteClient = (id: string) => saveClients(getClients().filter(c => c.id !== id));

export const getProjects = (): Project[] => getItems<Project>(KEYS.PROJECTS);
export const saveProjects = (projects: Project[]) => setItems(KEYS.PROJECTS, projects);
export const updateProject = async (project: Project): Promise<void> => {
    const all = getProjects();

    // 🛡️ Self-Healing: Migrate legacy IDs (TimeStamp) to UUIDs
    // Check if ID is a simple number (timestamp) or short string, unlikely to be a UUID
    let projectToSave = { ...project };
    const isLegacyId = !project.id.includes('-') && project.id.length < 20;

    if (isLegacyId) {
        console.log("♻️ Migrating legacy Project ID to UUID...", project.id);
        const oldId = project.id;
        const newId = crypto.randomUUID();
        projectToSave.id = newId;

        // Find by OLD ID to replace
        const index = all.findIndex(p => p.id === oldId);
        if (index >= 0) all[index] = projectToSave; else all.unshift(projectToSave);

        // Update URL if user is currently on it? 
        // We can't easily change the URL from here without router access, 
        // but the save will work and next time they open it from dashboard it will use new ID.
    } else {
        // Normal Save
        const index = all.findIndex(p => p.id === projectToSave.id);
        if (index >= 0) all[index] = projectToSave; else all.unshift(projectToSave);
    }

    // 🛡️ Token Self-Healing: Check if token is valid UUID
    if (projectToSave.public_token && (!projectToSave.public_token.includes('-') || projectToSave.public_token.length < 20)) {
        console.log("♻️ Migrating legacy Token to UUID...", projectToSave.public_token);
        projectToSave.public_token = crypto.randomUUID();
        // Update again in the array
        const index = all.findIndex(p => p.id === projectToSave.id);
        if (index >= 0) all[index] = projectToSave;
    }

    saveProjects(all);

    // Auto-sync to cloud (NOW RETURNS PROMISE)
    const user = getUser();
    console.log("🔍 [DEBUG] User from getUser():", user);

    if (user) {
        // ✅ Only sync if project has minimum required data
        const hasRequiredData = projectToSave.clientName && projectToSave.projectType && projectToSave.startDate && projectToSave.deadline;
        console.log("🔍 [DEBUG] hasRequiredData:", hasRequiredData, {
            clientName: projectToSave.clientName,
            projectType: projectToSave.projectType,
            startDate: projectToSave.startDate,
            deadline: projectToSave.deadline
        });

        if (!hasRequiredData) {
            console.log("⏭️ Skipping Supabase sync - project missing required fields (clientName, projectType, startDate, or deadline)");
            return; // Save locally but don't sync to cloud yet
        }

        console.log("🔍 [DEBUG] Getting Supabase user...");
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        const userId = supabaseUser?.id;
        console.log("🔍 [DEBUG] Supabase userId:", userId);

        if (!userId) {
            console.warn("User has no ID and not authenticated in Supabase. Skipping sync.");
            return;
        }

        // Payload with ALL required columns + data JSONB
        const payload = {
            id: projectToSave.id,
            user_id: userId,
            client_name: projectToSave.clientName,
            client_cpf: projectToSave.clientCpf || null,
            client_address: projectToSave.clientAddress || null,
            client_city: projectToSave.clientCity || null,
            project_type: projectToSave.projectType,
            start_date: projectToSave.startDate || new Date().toISOString(), // Use current date if not provided
            deadline: projectToSave.deadline,
            deadline_notified: projectToSave.deadlineNotified || false,
            data: projectToSave, // Full project object in JSONB
            public_token: projectToSave.public_token,
            status: projectToSave.status || 'active',
            approved_at: projectToSave.approved_at || null
        };

        console.log("🚀 Salvando projeto no Supabase:", payload);

        const { error } = await supabase.from('projects').upsert(payload);

        if (error) {
            console.error("❌ Auto-sync project failed:", error);
            throw new Error(`Erro ao sincronizar com nuvem: ${error.message}`);
        } else {
            console.log("✅ Projeto sincronizado com sucesso!");
        }
    } else {
        console.log("⏭️ Skipping Supabase sync - no user logged in");
    }
};

export const deleteProject = async (projectId: string): Promise<void> => {
    // 1. Delete locally
    const projects = getProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    saveProjects(filtered);

    // 2. Delete from cloud (Supabase) if user is logged in
    const user = getUser();
    if (user && projectId) {
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

            if (error) {
                console.error('❌ Error deleting project from Supabase:', error);
            } else {
                console.log('✅ Project deleted from Supabase');
            }
        } catch (err) {
            console.error('❌ Exception deleting project:', err);
        }
    }
};

export const checkProjectDeadlines = () => {
    const projects = getProjects();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    projects.forEach(project => {
        if (project.status === 'active' && project.deadline && !project.deadlineNotified) {
            const deadline = new Date(project.deadline);
            deadline.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 3 && diffDays >= 0) {
                sendNotification(`Vencimento: ${project.clientName}`, {
                    body: `Projeto "${project.projectType}" vence em ${diffDays === 0 ? 'hoje' : diffDays + ' dias'}.`,
                });
                const updated = projects.map(p => p.id === project.id ? { ...p, deadlineNotified: true } : p);
                saveProjects(updated);
            }
        }
    });
};

export const getSettings = (): AppSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) return defaultSettings;
    try { return JSON.parse(data); } catch { return defaultSettings; }
};
export const saveSettings = (settings: AppSettings) => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));

export const getCompanyProfile = (): CompanyProfile => {
    const data = localStorage.getItem(KEYS.COMPANY);
    if (!data) return {
        name: 'Marcenaria Pro',
        cnpj: '',
        address: '',
        contact: '',
        contractTemplate: defaultContractTemplate
    };
    try {
        const parsed = JSON.parse(data);
        if (!parsed.contractTemplate || parsed.contractTemplate.length === 0) {
            parsed.contractTemplate = defaultContractTemplate;
        }
        return parsed;
    } catch {
        return {
            name: 'Marcenaria Pro',
            cnpj: '',
            address: '',
            contact: '',
            contractTemplate: defaultContractTemplate
        };
    }
};
export const saveCompanyProfile = (profile: CompanyProfile) => {
    localStorage.setItem(KEYS.COMPANY, JSON.stringify(profile));

    // Auto-sync company profile (Fire & Forget)
    const user = getUser();
    if (user) {
        supabase.from('company').upsert({ email: user.email, data: profile }).then(res => {
            if (res.error) console.error("Auto-sync company failed:", res.error);
        });
    }
};

export const getUser = (): UserProfile | null => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
};
export const saveUser = (user: UserProfile) => localStorage.setItem(KEYS.USER, JSON.stringify(user));

export const loginUser = (name: string, email: string, document?: string): UserProfile => {
    const existing = getUser();
    if (existing && existing.email === email) return existing;
    const deviceId = getDeviceId();
    const newUser: UserProfile = {
        name,
        email,
        document,
        plan: 'free',
        downloadCount: 0,
        devices: [{ id: deviceId, name: 'Web Browser', lastAccess: new Date().toISOString() }]
    };
    saveUser(newUser);
    return newUser;
};


export const logoutUser = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.LAST_SYNC);
};

export const upgradeSubscription = (plan: SubscriptionPlan) => {
    const user = getUser();
    if (user) {
        const updatedUser = { ...user, plan, subscriptionDate: new Date().toISOString() };
        saveUser(updatedUser);
        syncToCloud();
        return updatedUser;
    }
    return null;
};

export const removeDevice = (deviceId: string) => {
    const user = getUser();
    if (user) {
        const updatedUser = { ...user, devices: user.devices.filter(d => d.id !== deviceId) };
        saveUser(updatedUser);
        syncToCloud();
    }
};

export const incrementDownloadCount = (): UserProfile | null => {
    const user = getUser();
    if (user) {
        const updatedUser = { ...user, downloadCount: (user.downloadCount || 0) + 1 };
        saveUser(updatedUser);
        return updatedUser;
    }
    return null;
};

export const getLastSyncDate = (): string | null => {
    return localStorage.getItem(KEYS.LAST_SYNC);
};

export const calculateHourlyRate = (fixedCosts: FixedCost[], settings: AppSettings): number => {
    const totalFixed = fixedCosts.reduce((sum, item) => sum + item.amount, 0);
    const totalHours = settings.workingDaysPerMonth * settings.workingHoursPerDay;
    return totalHours === 0 ? 0 : totalFixed / totalHours;
};

export const calculateProjectFinancials = (p: Partial<Project>, settings: AppSettings) => {
    const materials = Number(p.materialsCost) || 0;
    const prodDays = Number(p.productionDays) || 0;
    const assDays = Number(p.assemblyDays) || 0;
    const totalHours = (prodDays + assDays) * settings.workingHoursPerDay;
    const shopOverheadCost = totalHours * settings.hourlyRate;
    const freight = Number(p.freightCost) || 0;
    const totalBaseCost = materials + shopOverheadCost + freight;
    const divisor = 1 - ((p.marginPercent || 0) / 100) - ((p.taxPercent || 0) / 100) - ((p.carpenterPercent || 0) / 100);
    const suggestedPrice = divisor > 0 ? totalBaseCost / divisor : 0;
    return { totalBaseCost, shopOverheadCost, freight, suggestedPrice, profit: suggestedPrice * ((p.marginPercent || 0) / 100), prodDays, assDays, carpenterValue: suggestedPrice * ((p.carpenterPercent || 0) / 100) };
};
