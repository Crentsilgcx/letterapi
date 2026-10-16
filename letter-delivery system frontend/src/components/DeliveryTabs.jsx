import { useMemo } from 'react';
import { PackageCheck, Package } from 'lucide-react';
import '../tokens.css';
import './DeliveryTabs.css';

const TABS = [
  { id: 'pending', label: 'Awaiting receipt', icon: Package },
  { id: 'received', label: 'Received', icon: PackageCheck },
];

function DeliveryTabs({ activeTab, onTabChange, pendingCount, receivedCount }) {
  const tabsWithCounts = useMemo(() => [
    { ...TABS[0], count: pendingCount },
    { ...TABS[1], count: receivedCount },
  ], [pendingCount, receivedCount]);

  return (
    <div className="delivery-tabs" role="tablist" aria-label="Delivery status">
      {tabsWithCounts.map(({ id, label, count, icon: Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeTab === id}
          aria-controls={`${id}-panel`}
          id={`${id}-tab`}
          className={`delivery-tab${activeTab === id ? ' active' : ''}`}
          onClick={() => onTabChange(id)}
        >
          <Icon size={16} aria-hidden="true" />
          <span className="tab-label">{label}</span>
          <span className={`tab-count${activeTab === id ? ' active' : ''}`} aria-live="polite" aria-atomic="true">
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}

export default DeliveryTabs;