import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-rose-200 shadow-xl space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Something went wrong in this view</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {this.state.error?.message || 'A runtime error occurred in this module.'}
          </p>
          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                if (this.props.onReset) this.props.onReset();
                else window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload View</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
