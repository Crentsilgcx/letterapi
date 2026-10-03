import { Circle, Loader2 } from 'lucide-react';
import '../tokens.css';
import './ConnectionStatus.css';

function ConnectionStatus({ isConnected }) {
  if (isConnected) {
    return (
      <span className="connection-status connected" aria-live="polite" aria-atomic="true">
        <span className="status-dot" aria-hidden="true">
          <Circle size={8} />
        </span>
        <span>Live</span>
      </span>
    );
  }

  return (
    <span className="connection-status reconnecting" aria-live="polite" aria-atomic="true">
      <span className="status-dot" aria-hidden="true">
        <Loader2 size={14} className="spinning" />
      </span>
      <span>Reconnecting</span>
    </span>
  );
}

export default ConnectionStatus;