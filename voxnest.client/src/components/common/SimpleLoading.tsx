import React from 'react';

interface SimpleLoadingProps {
  /** 加载提示文本 */
  text?: string;
  /** 是否显示VoxNest Logo */
  showLogo?: boolean;
  /** 背景类型 */
  background?: 'gradient' | 'transparent' | 'white';
  /** 大小 */
  size?: 'small' | 'medium' | 'large';
  /** 加载动画类型 */
  loadingType?: 'spinner' | 'dots';
}

const SimpleLoading: React.FC<SimpleLoadingProps> = ({
  text = '',
  showLogo = true,
  background = 'gradient',
  size = 'medium',
  loadingType = 'spinner'
}) => {
  const sizeConfig = {
    small: {
      container: { padding: '32px' },
      logo: { width: '40px', height: '40px', fontSize: '20px' },
      text: { fontSize: '14px', marginTop: '16px' },
      spinner: { width: '24px', height: '24px' }
    },
    medium: {
      container: { padding: '48px' },
      logo: { width: '56px', height: '56px', fontSize: '28px' },
      text: { fontSize: '16px', marginTop: '24px' },
      spinner: { width: '32px', height: '32px' }
    },
    large: {
      container: { padding: '64px' },
      logo: { width: '72px', height: '72px', fontSize: '36px' },
      text: { fontSize: '18px', marginTop: '32px' },
      spinner: { width: '40px', height: '40px' }
    }
  };

  const config = sizeConfig[size];

  const backgroundStyles = {
    gradient: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    },
    transparent: {
      background: 'transparent'
    },
    white: {
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      minHeight: '100vh'
    }
  };

  const textColor = background === 'gradient' ? 'white' : 'var(--text-primary)';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...backgroundStyles[background]
    }}>
      <div style={{
        textAlign: 'center',
        ...config.container
      }}>
        {/* VoxNest Logo */}
        {showLogo && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            borderRadius: '50%',
            marginBottom: '16px',
            ...config.logo,
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}>
            V
          </div>
        )}

        {/* 加载动画 */}
        {loadingType === 'spinner' ? (
          <div style={{
            display: 'inline-block',
            ...config.spinner,
            border: `3px solid ${background === 'gradient' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(79, 70, 229, 0.2)'}`,
            borderTop: `3px solid ${background === 'gradient' ? 'white' : '#4F46E5'}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: text ? '16px' : showLogo ? '0' : '0'
          }} />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: size === 'small' ? '6px' : size === 'medium' ? '8px' : '10px',
            marginBottom: text ? '16px' : showLogo ? '0' : '0'
          }}>
            {[1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                style={{
                  width: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                  height: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                  borderRadius: '50%',
                  backgroundColor: background === 'gradient' ? 'white' : 'var(--primary-color)',
                  animation: `fadeInOut 1.4s ease-in-out infinite`,
                  animationDelay: `${(index - 1) * 0.2}s`,
                  opacity: 0.3
                }}
              />
            ))}
          </div>
        )}

        {/* 加载文本 */}
        {text && (
          <div style={{
            color: textColor,
            fontWeight: '500',
            opacity: 0.9,
            ...config.text
          }}>
            {text}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        
        @keyframes fadeInOut {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleLoading;
