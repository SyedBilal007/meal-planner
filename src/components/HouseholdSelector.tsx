import { useState } from 'react';
import type { FormEvent } from 'react';
import { ChevronDown, Home, Plus, UserPlus, Loader2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createHousehold, joinHousehold } from '../api/householdClient';

export default function HouseholdSelector() {
  const {
    households,
    activeHouseholdId,
    setActiveHousehold,
    refreshHouseholds,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create household form state
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');

  // Join household form state
  const [joinInviteCode, setJoinInviteCode] = useState('');

  const activeHousehold = households.find((h) => h.id === activeHouseholdId);

  const handleSwitchHousehold = (householdId: number) => {
    setActiveHousehold(householdId);
    setIsOpen(false);
  };

  const handleCreateHousehold = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const newHousehold = await createHousehold({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
      });

      // Refresh households list
      await refreshHouseholds();

      // Set the new household as active
      setActiveHousehold(newHousehold.id);

      // Reset form and close modals
      setCreateName('');
      setCreateDescription('');
      setShowCreateModal(false);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHousehold = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const joinedHousehold = await joinHousehold(joinInviteCode.trim());

      // Refresh households list
      await refreshHouseholds();

      // Set the joined household as active
      setActiveHousehold(joinedHousehold.id);

      // Reset form and close modals
      setJoinInviteCode('');
      setShowJoinModal(false);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to join household');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 border border-gray-300 shadow-sm"
        >
          <Home className="w-5 h-5" />
          <span className="max-w-[200px] truncate">
            {activeHousehold?.name || 'No Household'}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown */}
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="p-2">
                {/* Existing households */}
                {households.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Your Households
                    </div>
                    {households.map((household) => (
                      <button
                        key={household.id}
                        onClick={() => handleSwitchHousehold(household.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          household.id === activeHouseholdId
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">{household.name}</div>
                        {household.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {household.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <button
                    onClick={() => {
                      setShowCreateModal(true);
                      setError('');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Household
                  </button>
                  <button
                    onClick={() => {
                      setShowJoinModal(true);
                      setError('');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Join Household
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Household Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Create New Household
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                  setCreateName('');
                  setCreateDescription('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHousehold} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="create-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Household Name *
                </label>
                <input
                  id="create-name"
                  type="text"
                  value={createName}
                  onChange={(e) => {
                    setCreateName(e.target.value);
                    setError('');
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="My Family"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="create-description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description (optional)
                </label>
                <textarea
                  id="create-description"
                  value={createDescription}
                  onChange={(e) => {
                    setCreateDescription(e.target.value);
                    setError('');
                  }}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  placeholder="A brief description of this household..."
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                    setCreateName('');
                    setCreateDescription('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Household Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Join Household
              </h2>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setError('');
                  setJoinInviteCode('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinHousehold} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="join-code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Invite Code *
                </label>
                <input
                  id="join-code"
                  type="text"
                  value={joinInviteCode}
                  onChange={(e) => {
                    setJoinInviteCode(e.target.value);
                    setError('');
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
                  placeholder="Enter invite code"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ask the household owner for the invite code
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setError('');
                    setJoinInviteCode('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

