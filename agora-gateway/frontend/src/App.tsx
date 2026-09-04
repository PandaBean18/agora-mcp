import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Mandate from './pages/Mandate';
import Onboarding from './pages/Onboarding';
import EnterpriseOnboarding from './pages/EnterpriseOnboarding';
import SmbOnboarding from './pages/SmbOnboarding';
import SmbDashboard from './pages/SmbDashboard';
import { Merchants } from './pages/Merchants';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/merchants" element={<Merchants />} />
      <Route path="/mandate/:token" element={<Mandate />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/onboarding/enterprise" element={<EnterpriseOnboarding />} />
      <Route path="/onboarding/smb" element={<SmbOnboarding />} />
      <Route path="/dashboard/:merchantId" element={<SmbDashboard />} />
    </Routes>
  );
}

export default App;
