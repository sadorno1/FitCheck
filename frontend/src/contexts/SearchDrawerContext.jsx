import React, { createContext, useContext, useState } from 'react';

const SearchDrawerContext = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export const SearchDrawerProvider = ({ children }) => {
  const [isOpen, setOpen] = useState(false);

  const open = () => setOpen(true);
  const close = () => setOpen(false);

  return (
    <SearchDrawerContext.Provider value={{ isOpen, open, close }}>
      {children}
    </SearchDrawerContext.Provider>
  );
};

export const useSearchDrawer = () => useContext(SearchDrawerContext);
