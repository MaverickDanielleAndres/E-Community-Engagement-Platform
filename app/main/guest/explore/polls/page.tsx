
// @/app/main/guest/explore/polls/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { PieChart, Users, Calendar, Eye } from 'lucide-react'

interface PublicPoll {
  id: string
  title: string
  description: string
  deadline: string
  vote_count: number
  status: string
}

export default function GuestExplorePolls() {
  const [polls, setPolls] = useState<PublicPoll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock public polls data
    const mockPolls: PublicPoll[] = [
      {
        id: '1',
        title: 'Community Garden Development',
        description: 'Should we develop a community garden in the vacant lot?',
        deadline: '2024-07-01T00:00:00Z',
        vote_count: 45,
        status: 'active'
      },
      {
        id: '2',
        title: 'Security Camera Installation',
        description: 'Installing security cameras at main entrances',
        deadline: '2024-06-25T00:00:00Z',
        vote_count: 38,
        status: 'active'
      }
    ]
    setPolls(mockPolls)
    setLoading(false)
  }, [])

  const columns = [
    {
      key: 'title' as const,
      header: 'Poll',
      render: (value: string, row: PublicPoll) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.description}</div>
        </div>
      )
    },
    {
      key: 'vote_count' as const,
      header: 'Participation',
      render: (value: number) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4 mr-1" />
          {value} votes
        </div>
      )
    },
    {
      key: 'deadline' as const,
      header: 'Deadline',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'id' as const,
      header: 'Action',
      render: () => (
        <span className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-400">
          <Eye className="w-4 h-4 mr-1" />
          View Only
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Polls</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View ongoing community decisions and their progress
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center">
          <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Join the community to participate in polls
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              As a guest, you can view poll results but cannot vote
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <DataTable
          data={polls}
          columns={columns}
          loading={loading}
          emptyMessage="No public polls available"
        />
      </div>
    </div>
  )
}