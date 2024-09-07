import React, { useState } from 'react';
import { DBLPSearch } from '../components/DBLPSearch';

const SearchPage: React.FC = () => {
  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-4">Search Papers</h1>
      <DBLPSearch />
    </div>
  );
};

export default SearchPage;