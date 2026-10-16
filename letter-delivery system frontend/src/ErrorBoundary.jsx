import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          margin: '16px',
          border: '1px solid #c0392b',
          borderRadius: '8px',
          background: '#fdeded',
          color: '#c0392b',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h2 style={{ margin: '0 0 12px' }}>Something went wrong</h2>
          <pre style={{
            overflow: 'auto',
            padding: '12px',
            background: '#fff',
            border: '1px solid #c0392b',
            borderRadius: '4px',
            fontSize: '13px',
            maxHeight: '300px'
          }}>
            {this.state.error?.message}
            {this.state.errorInfo?.componentStack && `\n\n${this.state.errorInfo.componentStack}`}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#c0392b',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}