import React, { useState } from 'react';
import { Search } from '../components/Search';

const SearchPage: React.FC = () => {
  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-4">Search Papers</h1>
      <Search />
    </div>
  );
};

export default SearchPage;