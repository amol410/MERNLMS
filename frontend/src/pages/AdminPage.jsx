import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ShieldCheck, Plus, Trash2, UserX, UserCheck, Users, X } from 'lucide-react';

export default function AdminPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/admin/trainers', form);
      toast.success(`Trainer "${data.user.name}" created!`);
      setForm({ name: '', email: '', password: '' });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create trainer');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle-active`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: data.user.isActive } : u));
      toast.success(data.user.isActive ? 'User activated' : 'User deactivated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const roleBadge = (role) => {
    const styles = {
      admin: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      trainer: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      student: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
    };
    return <span className={`badge text-xs capitalize ${styles[role] || styles.student}`}>{role}</span>;
  };

  const trainers = users.filter(u => u.role === 'trainer');
  const students = users.filter(u => u.role === 'student');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-orange-400" />
            Admin Panel
          </h1>
          <p className="text-gray-500 mt-1">{users.length} total users • {trainers.length} trainers • {students.length} students</p>
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary flex items-center gap-2">
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? 'Cancel' : 'Add Trainer'}
        </button>
      </div>

      {/* Create Trainer Form */}
      {showCreateForm && (
        <div className="glass-card p-6 mb-6 border border-orange-500/20">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Trainer</h2>
          <form onSubmit={handleCreateTrainer} className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-field text-sm"
                placeholder="Trainer Name"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field text-sm"
                placeholder="trainer@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field text-sm"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
                {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Trainer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'users', label: `All Users (${users.length})` },
          { key: 'trainers', label: `Trainers (${trainers.length})` },
          { key: 'students', label: `Students (${students.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30' : 'text-gray-400 hover:text-white hover:bg-white/8'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="glass-card p-8 text-center text-gray-500">Loading users...</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(tab === 'users' ? users : tab === 'trainers' ? trainers : students).map(u => (
                <tr key={u._id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{u.name}</p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">{roleBadge(u.role)}</td>
                  <td className="px-5 py-4 text-gray-500 text-sm hidden sm:table-cell">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${u.isActive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.role !== 'admin' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(u._id)}
                          className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-yellow-400 hover:bg-yellow-500/20' : 'text-green-400 hover:bg-green-500/20'}`}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(u._id, u.name)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {(tab === 'users' ? users : tab === 'trainers' ? trainers : students).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                    No {tab === 'trainers' ? 'trainers' : tab === 'students' ? 'students' : 'users'} found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
