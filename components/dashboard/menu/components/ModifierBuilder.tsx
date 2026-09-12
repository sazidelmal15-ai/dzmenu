'use client';

import { Plus, Trash2, GripVertical, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModifierOption {
  id?: string;
  name: string;
  priceModifier: number;
  isAvailable: boolean;
  displayOrder: number;
}

export interface ModifierGroup {
  id?: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTI' | 'MULTI_WITH_QUANTITY';
  minSelections: number;
  maxSelections: number | null;
  displayOrder: number;
  modifiers: ModifierOption[];
}

interface Props {
  groups: ModifierGroup[];
  onChange: (groups: ModifierGroup[]) => void;
}

export default function ModifierBuilder({ groups, onChange }: Props) {
  
  const addGroup = () => {
    const newGroup: ModifierGroup = {
      name: '',
      selectionType: 'SINGLE',
      minSelections: 1,
      maxSelections: 1,
      displayOrder: groups.length,
      modifiers: []
    };
    onChange([...groups, newGroup]);
  };

  const updateGroup = (index: number, updates: Partial<ModifierGroup>) => {
    const newGroups = [...groups];
    newGroups[index] = { ...newGroups[index], ...updates };
    onChange(newGroups);
  };

  const removeGroup = (index: number) => {
    onChange(groups.filter((_, i) => i !== index));
  };

  const addOption = (groupIndex: number) => {
    const group = groups[groupIndex];
    const newOption: ModifierOption = {
      name: '',
      priceModifier: 0,
      isAvailable: true,
      displayOrder: group.modifiers.length
    };
    updateGroup(groupIndex, { modifiers: [...group.modifiers, newOption] });
  };

  const updateOption = (groupIndex: number, optionIndex: number, updates: Partial<ModifierOption>) => {
    const group = groups[groupIndex];
    const newOptions = [...group.modifiers];
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
    updateGroup(groupIndex, { modifiers: newOptions });
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const group = groups[groupIndex];
    updateGroup(groupIndex, { modifiers: group.modifiers.filter((_, i) => i !== optionIndex) });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-300">Modifier Groups</h3>
        <button
          type="button"
          onClick={addGroup}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add Group
        </button>
      </div>

      <AnimatePresence>
        {groups.map((group, groupIndex) => (
          <motion.div
            key={groupIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden"
          >
            {/* Group Header */}
            <div className="bg-gray-800/80 p-4 border-b border-gray-700 flex flex-wrap gap-4 items-start sm:items-center">
              <GripVertical className="text-gray-500 cursor-move hidden sm:block" size={20} />
              
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Group Name (e.g. Size, Toppings)"
                  value={group.name}
                  onChange={(e) => updateGroup(groupIndex, { name: e.target.value })}
                  className="w-full bg-transparent text-white font-semibold text-lg placeholder-gray-500 border-none focus:ring-0 p-0"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={group.selectionType}
                  onChange={(e) => updateGroup(groupIndex, { selectionType: e.target.value as any })}
                  className="bg-gray-900 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="SINGLE">Single Select</option>
                  <option value="MULTI">Multi Select</option>
                  <option value="MULTI_WITH_QUANTITY">Multi w/ Quantity</option>
                </select>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Min:</span>
                  <input
                    type="number"
                    min="0"
                    value={group.minSelections}
                    onChange={(e) => updateGroup(groupIndex, { minSelections: parseInt(e.target.value) || 0 })}
                    className="w-16 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-center focus:border-blue-500"
                  />
                  <span>Max:</span>
                  <input
                    type="number"
                    min="1"
                    value={group.maxSelections || ''}
                    onChange={(e) => updateGroup(groupIndex, { maxSelections: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="∞"
                    className="w-16 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-center focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeGroup(groupIndex)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto sm:ml-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Options List */}
            <div className="p-4 space-y-3">
              <AnimatePresence>
                {group.modifiers.map((opt, optIndex) => (
                  <motion.div
                    key={optIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3"
                  >
                    <GripVertical className="text-gray-600 cursor-move" size={16} />
                    <input
                      type="text"
                      placeholder="Option Name"
                      value={opt.name}
                      onChange={(e) => updateOption(groupIndex, optIndex, { name: e.target.value })}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500"
                    />
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={opt.priceModifier}
                        onChange={(e) => updateOption(groupIndex, optIndex, { priceModifier: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-3 py-1.5 text-sm text-white focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(groupIndex, optIndex)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => addOption(groupIndex)}
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium ml-7 mt-2"
              >
                <Plus size={16} /> Add Option
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {groups.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-xl text-gray-500">
          <Settings2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No modifier groups added yet.</p>
          <button
            type="button"
            onClick={addGroup}
            className="mt-3 text-blue-400 hover:text-blue-300 font-medium text-sm"
          >
            Create your first group
          </button>
        </div>
      )}
    </div>
  );
}
