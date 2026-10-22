import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (typeof Icon === 'string') {
      return Icon;
    }
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon.$$typeof)) {
      const Component = Icon;
      return <Component className="w-9 h-9 text-dolphin-400" />;
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 text-4xl">
        {renderIcon()}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
