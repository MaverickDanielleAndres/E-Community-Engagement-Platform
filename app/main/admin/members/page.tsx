// @/app/main/admin/members/page.tsx
'use client'

import { DataTable, SearchInput, ConfirmDialog } from '@/components/ui'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Users, Copy, Edit, Trash2, Shield, User, Crown,
  Search, Filter, MoreVertical, Eye, UserCheck
} from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'
import { Toast } from '@/components/Toast'

interface Member {
  id: string
  name: string
  email: string
  role: string
  created_at: string
  updated_at: string | null
  status: string
}

interface CommunityInfo {
  id: string
  name: string
  code: string
}


export default function AdminMembers() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [communityInfo, setCommunityInfo] = useState<CommunityInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newRole, setNewRole] = useState('')
  const { isDark } = useTheme()

  useEffect(() => {
    fetchMembersAndCommunity()
  }, [])

  const fetchMembersAndCommunity = async () => {
    try {
      setLoading(true)

      // Fetch members data
      const membersResponse = await fetch('/api/admin/members')

      if (!membersResponse.ok) {
        if (membersResponse.status === 401) {
          setToast({ message: 'Please log in to view members', type: 'error' })
          return
        }
        throw new Error('Failed to fetch members data')
      }

      const membersData = await membersResponse.json()

      // Set community info from the API response
      if (membersData.community) {
        setCommunityInfo(membersData.community)
      }

      setMembers(membersData.members || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setToast({ message: 'Error loading members data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = async () => {
    if (communityInfo?.code) {
      try {
        await navigator.clipboard.writeText(communityInfo.code)
        setToast({ message: 'Community code copied to clipboard', type: 'success' })
      } catch (error) {
        setToast({ message: 'Failed to copy code', type: 'error' })
      }
    }
  }

  const handleRoleChange = async () => {
    if (!selectedMember || !newRole) return

    try {
      const response = await fetch(`/api/admin/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error('Failed to update member role')
      }

      setToast({ message: 'Member role updated successfully', type: 'success' })
      setShowRoleDialog(false)
      setSelectedMember(null)
      fetchMembersAndCommunity() // Refresh data
    } catch (error) {
      console.error('Failed to update role:', error)
      setToast({ message: 'Error updating member role', type: 'error' })
    }
  }

  const handleDeleteMember = async () => {
    if (!selectedMember) return

    try {
      const response = await fetch(`/api/admin/members/${selectedMember.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove member')
      }

      setToast({ message: 'Member removed successfully', type: 'success' })
      setShowDeleteDialog(false)
      setSelectedMember(null)
      fetchMembersAndCommunity() // Refresh data
    } catch (error) {
      console.error('Failed to remove member:', error)
      setToast({ message: 'Error removing member', type: 'error' })
    }
  }

  const openRoleDialog = (member: Member) => {
    setSelectedMember(member)
    setNewRole(member.role)
    setShowRoleDialog(true)
  }

  const openDeleteDialog = (member: Member) => {
    setSelectedMember(member)
    setShowDeleteDialog(true)
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'moderator':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role.toLowerCase() === roleFilter.toLowerCase()
    return matchesSearch && matchesRole
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Community Members
        </h1>
        <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
          Manage your community members and their access levels
        </p>
      </motion.div>

      {/* Community Code Section */}
      {communityInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Community Access Code</h2>
              <p className="text-blue-100 mb-4">
                Share this code with users to allow them to join your community
              </p>
              <div className="flex items-center space-x-3">
                <code className="bg-white/20 px-4 py-2 rounded-lg text-lg font-mono">
                  {communityInfo.code}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
            <div className="hidden sm:block">
              <Users className="w-16 h-16 text-blue-200" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Total Members
              </p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {members.length}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Administrators
              </p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {members.filter(m => m.role.toLowerCase() === 'admin').length}
              </p>
            </div>
            <Crown className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Active Today
              </p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {members.filter(m => {
                  if (!m.updated_at) return false
                  const lastActive = new Date(m.updated_at)
                  const today = new Date()
                  return lastActive.toDateString() === today.toDateString()
                }).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="resident">Resident</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Members Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Members ({filteredMembers.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-slate-700' : 'bg-slate-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Member
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Role
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Joined
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Last Active
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
              {filteredMembers.map((member, index) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDark ? 'bg-slate-600' : 'bg-slate-200'
                      }`}>
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {member.name}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(member.role)}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    isDark ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {formatDate(member.created_at)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    isDark ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {member.updated_at ? formatDate(member.updated_at) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openRoleDialog(member)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          isDark
                            ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700'
                            : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                        }`}
                        title="Edit Role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(member)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          isDark
                            ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700'
                            : 'text-slate-600 hover:text-red-600 hover:bg-slate-100'
                        }`}
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredMembers.length === 0 && (
            <div className="p-12 text-center">
              <Users className={`w-12 h-12 mx-auto mb-4 ${
                isDark ? 'text-slate-600' : 'text-slate-400'
              }`} />
              <p className={`text-lg font-medium mb-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                No members found
              </p>
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                {searchTerm || roleFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No members have joined your community yet'
                }
              </p>
            </div>
          )}
        </div>
      </motion.div>

      

      {/* Role Change Dialog */}
      <ConfirmDialog
        isOpen={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        onConfirm={handleRoleChange}
        title="Change Member Role"
        description={`Change ${selectedMember?.name}'s role to:`}
        confirmLabel="Update Role"
        variant="default"
      >
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border ${
            isDark
              ? 'bg-slate-700 border-slate-600 text-white'
              : 'bg-white border-slate-300 text-slate-900'
          }`}
        >
          <option value="Resident">Resident</option>
          <option value="Moderator">Moderator</option>
          <option value="Admin">Admin</option>
        </select>
      </ConfirmDialog>

      {/* Delete Member Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteMember}
        title="Remove Member"
        description={`Are you sure you want to remove ${selectedMember?.name} from the community? This action cannot be undone.`}
        confirmLabel="Remove Member"
        variant="danger"
      />
    </div>
  )
}
