'use client';

import { useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Testbed } from '@/types';
import { Plus, FlaskConical, Trash2, Edit2, Monitor } from 'lucide-react';

export default function TestbedsTab() {
  const { testbeds, devices, addTestbed, deleteTestbed, updateTestbed, removeDeviceFromTestbed } = useDeviceStore();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTestbed, setSelectedTestbed] = useState<Testbed | null>(null);
  const [newTestbed, setNewTestbed] = useState({ name: '', description: '', location: '' });

  const handleAdd = () => {
    if (!newTestbed.name) return;
    addTestbed({
      id: crypto.randomUUID(),
      name: newTestbed.name,
      description: newTestbed.description,
      location: newTestbed.location,
      devices: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewTestbed({ name: '', description: '', location: '' });
    setShowAdd(false);
  };

  const getTestbedDevices = (testbed: Testbed) => {
    return devices.filter((d) => d.testbedId === testbed.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Test Beds</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} />
          New Testbed
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-medium mb-3">Create New Testbed</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Testbed name"
              value={newTestbed.name}
              onChange={(e) => setNewTestbed({ ...newTestbed, name: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Description"
              value={newTestbed.description}
              onChange={(e) => setNewTestbed({ ...newTestbed, description: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Location"
              value={newTestbed.location}
              onChange={(e) => setNewTestbed({ ...newTestbed, location: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleAdd} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
          </div>
        </div>
      )}

      {/* Testbed grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testbeds.map((testbed) => {
          const tbDevices = getTestbedDevices(testbed);
          return (
            <div
              key={testbed.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTestbed(testbed)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FlaskConical size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{testbed.name}</h3>
                    <p className="text-xs text-gray-500">{testbed.location}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTestbed(testbed.id); }}
                  className="p-1 hover:bg-red-50 rounded"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
              {testbed.description && (
                <p className="text-sm text-gray-600 mt-2">{testbed.description}</p>
              )}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <Monitor size={14} />
                <span>{tbDevices.length} device(s) assigned</span>
              </div>
              {tbDevices.length > 0 && (
                <div className="mt-2 space-y-1">
                  {tbDevices.slice(0, 3).map((d) => (
                    <div key={d.id} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      {d.serialNumber} • {d.model}
                    </div>
                  ))}
                  {tbDevices.length > 3 && (
                    <p className="text-xs text-gray-400">+{tbDevices.length - 3} more</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {testbeds.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <FlaskConical size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">No testbeds created yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a testbed to organize devices for testing</p>
        </div>
      )}
    </div>
  );
}
