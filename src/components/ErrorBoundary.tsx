import { Component, type ReactNode } from 'react'

type ErrorBoundaryProps = {
    children: ReactNode
    fallback?: ReactNode
}

type ErrorBoundaryState = {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center p-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
                            <p className="text-gray-600 mb-4">
                                {this.state.error?.message || 'An unexpected error occurred'}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                )
            )
        }

        return this.props.children
    }
}
