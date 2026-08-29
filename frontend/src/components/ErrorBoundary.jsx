import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#f8d7da', color: '#721c24', height: '100vh', width: '100vw', overflow: 'auto' }}>
          <h2>Something went wrong in React.</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre>{this.state.error && this.state.error.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px', marginTop: '10px' }}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
