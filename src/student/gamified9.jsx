// gamified9.jsx
import { useNavigate } from 'react-router-dom';

function Gamified9() {
  const navigate = useNavigate();
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>

      {/* ── Header ── */}
      <div style={{
        background: '#A50034',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '7px 16px', borderRadius: 20, border: '2px solid #fff',
            background: 'transparent', color: '#fff', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Arial, sans-serif', fontSize: 13,
            whiteSpace: 'nowrap',
          }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', letterSpacing: 2, textTransform: 'uppercase' }}>
            GAMIFIED QUIZ
          </span>
          <h1 style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', margin: 0, lineHeight: 1.3, fontFamily: 'Arial, sans-serif' }}>
            Keyboarding
          </h1>
        </div>
      </div>

      {/* ── Game Panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          width: 'min(1500px, calc(100vw - 40px))',
          height: 'min(800px, calc(100vh - 120px))',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          border: '2px solid #f0d0d5',
        }}>
          <iframe
            src="/games/quiz9/index.html"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            allowFullScreen
          />
        </div>
      </div>

    </div>
  );
}

export default Gamified9;