import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import EnterpriseOnboarding from './pages/EnterpriseOnboarding';
import SmbOnboarding from './pages/SmbOnboarding';
import SmbDashboard from './pages/SmbDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/mandate/:token" element={<Home />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/onboarding/enterprise" element={<EnterpriseOnboarding />} />
      <Route path="/onboarding/smb" element={<SmbOnboarding />} />
      <Route path="/dashboard/:merchantId" element={<SmbDashboard />} />
    </Routes>
  );
}

export default App;
