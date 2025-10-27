import React, { useState } from 'react';
import { Type } from 'lucide-react';
import { api } from '../../services/api';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const TextInput = ({ onIngredientsExtracted }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      const result = await api.ingredients.extractFromText(inputText);
      onIngredientsExtracted(result.ingredients);
      setInputText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Type className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="font-semibold text-gray-800 dark:text-white">Text Input</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Type your ingredients
      </p>
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="e.g., tomato, chicken, rice"
          onKeyPress={(e) => e.key === 'Enter' && handleExtract()}
          className="flex-1"
        />
        <Button onClick={handleExtract} loading={loading} variant="primary">
          Add
        </Button>
      </div>
    </div>
  );
};