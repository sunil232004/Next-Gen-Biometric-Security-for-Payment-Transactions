import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './store/store';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // Log the error to your error reporting service
    console.error('Error caught by boundary:', {
      error: error,
      componentStack: errorInfo.componentStack,
      message: error.message,
      stack: error.stack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#374151'
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            color: '#DC2626',
            marginBottom: '1rem' 
          }}>
            Something went wrong
          </h1>
          <div style={{ 
            background: '#FEF2F2', 
            border: '1px solid #FCA5A5',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Error:</strong> {this.state.error?.message}
            </p>
            {this.state.errorInfo && (
              <pre style={{ 
                whiteSpace: 'pre-wrap',
                fontSize: '0.875rem',
                background: '#FFF',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                marginTop: '0.5rem'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Reload Page
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#ffffff',
                color: '#2563EB',
                border: '1px solid #2563EB',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);
