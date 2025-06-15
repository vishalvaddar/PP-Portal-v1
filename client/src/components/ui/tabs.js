import React, { useState, createContext, useContext } from 'react';
import clsx from 'clsx';

const TabsContext = createContext();

export const Tabs = ({ defaultValue, children, className }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={clsx('tabs-container', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className }) => {
  return (
    <div className={clsx('tabs-list flex gap-2', className)}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ value, children, className }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={clsx(
        'px-4 py-2 rounded-md font-medium transition',
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className }) => {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;

  return <div className={clsx('mt-4', className)}>{children}</div>;
};
