import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './StatePanels';

interface Props {
  children: ReactNode;
  /** Shown in the message so the learner knows which part failed (e.g. "the 3D lab"). */
  area?: string;
}

interface State {
  error: Error | null;
}

/** Catches render errors in its subtree so one failing area (e.g. the 3D canvas) does not blank the app. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Local only: no third-party error reporting (docs/SYSTEM_ARCHITECTURE.md section 9).
    console.error('ErrorBoundary caught', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  override render() {
    if (this.state.error) {
      return (
        <ErrorState
          message={`Sorry, ${this.props.area ?? 'this part of the app'} could not be displayed.`}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
