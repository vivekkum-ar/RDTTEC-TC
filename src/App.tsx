import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { TCForm } from './components/TCForm';
import { BulkUpload } from './components/BulkUpload';
import { History } from './components/History';
import { TCPreview } from './components/TCPreview';
import { BonafideForm } from './components/BonafideForm';
import { BonafideHistory } from './components/BonafideHistory';
import { BulkBonafide } from './components/BulkBonafide';
import { generateTCNumber, type TCData, DEFAULT_SCHOOL_INFO } from './types';
import { useState, useEffect } from 'react';
import { FileText, Clock, Settings, Moon, Sun, LogOut, Database, CheckCircle2, XCircle, ChevronDown, ChevronRight, Award } from 'lucide-react';
import { Button } from './components/ui/button';
import { AuthGuard } from './components/AuthGuard';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './lib/AuthContext';
import { Dialog, DialogContent } from './components/ui/dialog';

function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [tcOpen, setTcOpen] = useState(true);
  const [bfOpen, setBfOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);

  const isTCActive = location.pathname === '/' || location.pathname === '/bulk';
  const isBFActive = location.pathname === '/bonafide' || location.pathname === '/bonafide-bulk';
  const isHistActive = location.pathname === '/history' || location.pathname === '/bonafide-history';

  useEffect(() => {
    if (isTCActive) setTcOpen(true);
    if (isBFActive) setBfOpen(true);
    if (isHistActive) setHistOpen(true);
  }, [isTCActive, isBFActive, isHistActive]);

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300 ease-in-out group"
      style={{ width: expanded ? '16rem' : '4rem' }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex h-16 items-center border-b px-3 overflow-hidden">
        <img
          src="/NTTFARROW.png"
          alt="NTTF"
          className="h-9 w-9 shrink-0"
        />
        <div className={`ml-3 flex flex-col transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <span className="text-sm font-semibold leading-none whitespace-nowrap">TC Generator</span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">NTTF Transfer System</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-2">
        {/* Transfer Certificate group */}
        <button
          onClick={() => setTcOpen(!tcOpen)}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            isTCActive ? 'bg-[#f5821f]/10 text-[#f5821f]' : 'hover:bg-accent/50 text-foreground'
          }`}
        >
          <FileText className={`h-5 w-5 shrink-0 ${isTCActive ? 'text-[#f5821f]' : 'text-muted-foreground'}`} />
          <span className={`truncate transition-opacity duration-200 flex-1 text-left ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            Transfer Certificate
          </span>
          {expanded && (
            tcOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>
        {tcOpen && expanded && (
          <div className="ml-4 flex flex-col gap-0.5">
            <Link to="/">
              <Button
                variant={location.pathname === '/' ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 text-sm font-normal h-10 px-3 relative ${
                  location.pathname === '/'
                    ? 'bg-[#f5821f]/10 text-[#f5821f] font-medium before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-0.5 before:rounded-full before:bg-[#f5821f]'
                    : 'hover:bg-accent/50'
                }`}
              >
                <span className="truncate">TC Form</span>
              </Button>
            </Link>
            <Link to="/bulk">
              <Button
                variant={location.pathname === '/bulk' ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 text-sm font-normal h-10 px-3 relative ${
                  location.pathname === '/bulk'
                    ? 'bg-[#f5821f]/10 text-[#f5821f] font-medium before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-0.5 before:rounded-full before:bg-[#f5821f]'
                    : 'hover:bg-accent/50'
                }`}
              >
                <span className="truncate">Bulk Upload</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Bonafide group */}
        <button
          onClick={() => setBfOpen(!bfOpen)}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            isBFActive ? 'bg-[#1d8bcb]/10 text-[#1d8bcb]' : 'hover:bg-accent/50 text-foreground'
          }`}
        >
          <Award className={`h-5 w-5 shrink-0 ${isBFActive ? 'text-[#1d8bcb]' : 'text-muted-foreground'}`} />
          <span className={`truncate transition-opacity duration-200 flex-1 text-left ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            Bonafide
          </span>
          {expanded && (
            bfOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>
        {bfOpen && expanded && (
          <div className="ml-4 flex flex-col gap-0.5">
            <Link to="/bonafide">
              <Button
                variant={location.pathname === '/bonafide' ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 text-sm font-normal h-10 px-3 relative ${
                  location.pathname === '/bonafide'
                    ? 'bg-[#1d8bcb]/10 text-[#1d8bcb] font-medium before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-0.5 before:rounded-full before:bg-[#1d8bcb]'
                    : 'hover:bg-accent/50'
                }`}
              >
                <span className="truncate">Bonafide Form</span>
              </Button>
            </Link>
            <Link to="/bonafide-bulk">
              <Button
                variant={location.pathname === '/bonafide-bulk' ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 text-sm font-normal h-10 px-3 relative ${
                  location.pathname === '/bonafide-bulk'
                    ? 'bg-[#1d8bcb]/10 text-[#1d8bcb] font-medium before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-0.5 before:rounded-full before:bg-[#1d8bcb]'
                    : 'hover:bg-accent/50'
                }`}
              >
                <span className="truncate">Bulk Bonafide</span>
              </Button>
            </Link>
          </div>
        )}

        {/* History group */}
        <button
          onClick={() => setHistOpen(!histOpen)}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            isHistActive ? 'bg-[#f5821f]/10 text-[#f5821f]' : 'hover:bg-accent/50 text-foreground'
          }`}
        >
          <Clock className={`h-5 w-5 shrink-0 ${isHistActive ? 'text-[#f5821f]' : 'text-muted-foreground'}`} />
          <span className={`truncate transition-opacity duration-200 flex-1 text-left ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            History
          </span>
          {expanded && (
            histOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>
        {histOpen && expanded && (
          <div className="ml-4 flex flex-col gap-0.5">
            <Link to="/history">
              <Button
                variant={location.pathname === '/history' ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 text-sm font-normal h-10 px-3 relative ${
                  location.pathname === '/history'
                    ? 'bg-[#f5821f]/10 text-[#f5821f] font-medium before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-0.5 before:rounded-full before:bg-[#f5821f]'
                    : 'hover:bg-accent/50'
                }`}
              >
                <span className="truncate">TC History</span>
              </Button>
            </Link>
            <Link to="/bonafide-history">
              <Button
                variant={location.pathname === '/bonafide-history' ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 text-sm font-normal h-10 px-3 relative ${
                  location.pathname === '/bonafide-history'
                    ? 'bg-[#1d8bcb]/10 text-[#1d8bcb] font-medium before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-0.5 before:rounded-full before:bg-[#1d8bcb]'
                    : 'hover:bg-accent/50'
                }`}
              >
                <span className="truncate">Bonafide History</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Settings */}
        <Link to="/settings">
          <Button
            variant={location.pathname === '/settings' ? 'secondary' : 'ghost'}
            className={`w-full justify-start gap-3 text-sm font-normal h-11 px-3 relative ${
              location.pathname === '/settings'
                ? 'bg-[#1d8bcb]/10 text-[#1d8bcb] font-medium before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-0.5 before:rounded-full before:bg-[#1d8bcb]'
                : 'hover:bg-accent/50'
            }`}
          >
            <Settings className={`h-5 w-5 shrink-0 ${location.pathname === '/settings' ? 'text-[#1d8bcb]' : 'text-muted-foreground'}`} />
            <span className={`truncate transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              Settings
            </span>
          </Button>
        </Link>
      </nav>

      <div className={`absolute bottom-0 left-0 right-0 border-t p-3 transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="text-[11px] text-muted-foreground text-center space-y-1">
          <p>RNTC TC Generator v2.0</p>
          <p>
            made by{' '}
            <a href="https://github.com/vivekkum-ar/" target="_blank" rel="noopener noreferrer" className="text-[#1d8bcb] hover:underline inline-flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Vivek Kumar
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}

function TCFormPage() {
  const [previewData, setPreviewData] = useState<TCData>({
    studentName: '',
    tokenNumber: '',
    dateOfBirth: '',
    fatherName: '',
    nationality: 'Indian',
    dateOfAdmission: '',
    courseAdmitted: '',
    dateOfLeaving: '',
    reasonForLeaving: '',
    dateOfApplication: '',
    conductCharacter: '',
    centreStudied: '',
  });
  const [generatedTCNumber, setGeneratedTCNumber] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreviewUpdate = (data: Partial<TCData>) => {
    setPreviewData((prev) => ({ ...prev, ...data }));
    if (data.centreStudied && data.tokenNumber) {
      const tcNumber = generateTCNumber(data.centreStudied, data.tokenNumber);
      setGeneratedTCNumber(tcNumber);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <TCForm onPreviewUpdate={handlePreviewUpdate} />
      <div className="xl:sticky xl:top-6 xl:self-start">
        <TCPreview
          data={previewData}
          tcNumber={generatedTCNumber}
          schoolInfo={DEFAULT_SCHOOL_INFO}
          onOpenPreview={() => setPreviewOpen(true)}
        />
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[700px] w-[90vw] max-h-[85vh] p-0 bg-transparent border-0 shadow-2xl overflow-y-auto">
          <div
            className="relative w-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/letterheadNttf.jpeg)' }}
          >
            <div className="absolute inset-0 bg-white/90" />
            <div className="relative z-10 pt-28 px-8 pb-8 flex flex-col">
              <div className="text-center mb-4">
                <img src="/NTTFLOGO.png" alt="NTTF" className="h-12 mx-auto mb-2" />
              </div>
              <TCPreview
                data={previewData}
                tcNumber={generatedTCNumber}
                schoolInfo={DEFAULT_SCHOOL_INFO}
                compact
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BulkUploadPage() {
  return <BulkUpload />;
}

function BonafideFormPage() {
  return <BonafideForm />;
}

function BulkBonafidePage() {
  return <BulkBonafide />;
}

function HistoryPage() {
  return <History />;
}

function BonafideHistoryPage() {
  return <BonafideHistory />;
}

function SettingsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [config, setConfig] = useState<{ spreadsheetId: string; sheetName: string; configured: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  const handleUnlock = () => {
    if (password === 'vivek123') {
      setUnlocked(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md mt-12">
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1d8bcb]/10">
              <Settings className="h-6 w-6 text-[#1d8bcb]" />
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-1">Settings Locked</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter the admin password to access settings.</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            placeholder="Enter password"
            className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#1d8bcb]"
            autoFocus
          />
          {error && <p className="text-xs text-destructive mb-3">{error}</p>}
          <Button onClick={handleUnlock} className="w-full bg-[#1d8bcb] hover:bg-[#1d8bcb]/90">Unlock Settings</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d8bcb]/10">
            <Database className="h-5 w-5 text-[#1d8bcb]" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Database Configuration</h3>
            <p className="text-sm text-muted-foreground">Backend storage connection</p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            {config ? (
              <span className={`inline-flex items-center gap-1.5 text-sm ${config.configured ? 'text-emerald-600' : 'text-destructive'}`}>
                {config.configured ? (
                  <><CheckCircle2 className="h-4 w-4" /> Connected</>
                ) : (
                  <><XCircle className="h-4 w-4" /> Not configured</>
                )}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Checking...</span>
            )}
          </div>
          {config && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database ID</span>
                <span className="text-xs font-mono text-muted-foreground truncate max-w-[250px]">{config.spreadsheetId || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Table Name</span>
                <span className="text-sm text-muted-foreground">{config.sheetName}</span>
              </div>
            </>
          )}
        </div>

        {!config?.configured && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">Missing Configuration</p>
            <p>Set the required environment variables in your <code className="text-xs bg-amber-100 px-1 rounded">.env</code> file, then restart the server.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const getPageTitle = () => {
    if (location.pathname === '/' || location.pathname === '/bulk') return 'Transfer Certificate';
    if (location.pathname === '/bonafide' || location.pathname === '/bonafide-bulk') return 'Bonafide Certificate';
    if (location.pathname === '/history') return 'TC History';
    if (location.pathname === '/bonafide-history') return 'Bonafide History';
    if (location.pathname === '/settings') return 'Settings';
    return 'Transfer Certificate';
  };

  const getPageSubtitle = () => {
    if (location.pathname === '/' || location.pathname === '/bulk') return 'Generate and manage transfer certificates';
    if (location.pathname === '/bonafide' || location.pathname === '/bonafide-bulk') return 'Generate and manage bonafide certificates';
    if (location.pathname === '/history') return 'View all generated transfer certificates';
    if (location.pathname === '/bonafide-history') return 'View all generated bonafide certificates';
    if (location.pathname === '/settings') return 'Application configuration';
    return 'Generate and manage transfer certificates';
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-[#1d8bcb]/15 via-[#f5821f]/10 via-background to-[#1d8bcb]/10 animate-gradient" style={{ backgroundSize: '200% 200%' }}>
        <Sidebar />
        <main className="pl-16 transition-all duration-300">
          <header className="sticky top-0 z-30 border-b bg-gradient-to-r from-[#1d8bcb]/15 via-[#f5821f]/10 via-card to-[#1d8bcb]/10 backdrop-blur-sm">
            <div className="flex items-center justify-between px-8 py-3">
              <div className="flex items-center gap-4">
                <img src="/NTTFLOGO.png" alt="NTTF" className="h-10 w-auto" />
                <div className="h-8 w-px bg-border" />
                <div>
                  <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
                  <p className="text-sm text-muted-foreground">{getPageSubtitle()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDarkMode(!darkMode)}
                  className="h-9 w-9"
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                {user && (
                  <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">{user.email}</span>
                  </Button>
                )}
              </div>
            </div>
          </header>
          <div className="p-8 animate-fade-in">
            <Routes>
              <Route path="/" element={<TCFormPage />} />
              <Route path="/bulk" element={<BulkUploadPage />} />
              <Route path="/bonafide" element={<BonafideFormPage />} />
              <Route path="/bonafide-bulk" element={<BulkBonafidePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/bonafide-history" element={<BonafideHistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
