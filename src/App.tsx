import { useNavigate } from 'react-router';
import { LiveAnalysis } from './screens/LiveAnalysis';

/** Trang của một dự án: portal dữ liệu thật đọc từ backend Runtime Verifier. */
export function App() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <LiveAnalysis onBackToProjects={() => navigate('/projects')} />
    </div>
  );
}

export default App;
