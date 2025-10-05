//  app/main/user/polls/page.tsx
 
 'use client'
 
 import { useState, useEffect } from 'react'
 import Link from 'next/link'
 import { DataTable, EmptyState } from '@/components/mainapp/components'
 import { PieChart, Eye, Calendar, Users, Clock } from 'lucide-react'
 import { ArrowPathIcon } from '@heroicons/react/24/outline'
 import { useTheme } from '@/components/ThemeContext'
 import { refreshHeaderAndSidebar } from '@/components/utils/refresh'
 
 interface Poll {
   id: string
   title: string
   description: string
   deadline: string
   created_at: string
   vote_count: number
   status: 'active' | 'closed' | 'draft'
   user_voted: boolean
 }
 
 export default function UserPolls() {
   const { isDark } = useTheme()
   const [polls, setPolls] = useState<Poll[]>([])
   const [loading, setLoading] = useState(true)
 
   useEffect(() => {
     const fetchPolls = async () => {
       try {
         const response = await fetch('/api/polls')
         if (response.ok) {
           const data = await response.json()
           setPolls(data.polls || [])
         }
       } catch (error) {
         console.error('Failed to fetch polls:', error)
       } finally {
         setLoading(false)
       }
     }
 
     fetchPolls()
 
     // Poll for updates every 30 seconds to reflect status changes
     const interval = setInterval(fetchPolls, 30000)
 
     return () => clearInterval(interval)
   }, [])
 
   const getStatusColor = (status: string) => {
     switch (status) {
       case 'active':
         return `bg-green-100 text-green-800 ${isDark ? 'dark:bg-green-900 dark:text-green-200' : ''}`
       case 'closed':
         return `bg-red-100 text-red-800 ${isDark ? 'dark:bg-red-900 dark:text-red-200' : ''}`
       default:
         return `bg-gray-100 text-gray-800 ${isDark ? 'dark:bg-gray-900 dark:text-gray-200' : ''}`
     }
   }
 
   const columns = [
     {
       key: 'title' as const,
       header: 'Poll',
       render: (value: string, row: Poll) => (
         <div>
           <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
           {row.description && (
             <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-xs`}>
               {row.description}
             </div>
           )}
         </div>
       )
     },
     {
       key: 'status' as const,
       header: 'Status',
       render: (value: string, row: Poll) => (
         <div className="flex items-center space-x-2">
           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
             {value.charAt(0).toUpperCase() +  value.slice(1)}
           </span>
           {row.user_voted && (
             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
               Voted
             </span>
           )}
         </div>
       )
     },
     {
       key: 'vote_count' as const,
       header: 'Participation',
       render: (value: number) => (
         <div className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
           <Users className={`w-4 h-4 mr-1 ${isDark ? 'text-white' : 'text-black'}`} />
           {value} votes
         </div>
       )
     },
     {
       key: 'deadline' as const,
       header: 'Deadline',
       render: (value: string) => {
         const isExpired = value && new Date(value) < new Date()
         return (
           <div className={`flex items-center text-sm ${
             isExpired ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-400' : 'text-gray-600')
           }`}>
             {isExpired ? <Clock className={`w-4 h-4 mr-1 ${isDark ? 'text-white' : 'text-black'}`} /> : <Calendar className={`w-4 h-4 mr-1 ${isDark ? 'text-white' : 'text-black'}`} />}
             {value ? new Date(value).toLocaleDateString() : 'No deadline'}
           </div>
         )
       }
     },
     {
       key: 'created_at' as const,
       header: 'Created',
       render: (value: string) => new Date(value).toLocaleDateString()
     },
     {
       key: 'id' as const,
       header: 'Action',
       render: (value: string, row: Poll) => {
         const canVote = row.status === 'active' && (!row.deadline || new Date(row.deadline) > new Date())
         
         return (
           <Link
             href={`/main/user/polls/${value}`}
             className={`inline-flex items-center px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
               canVote 
                 ? (isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700')
                 : (isDark ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-600 text-white hover:bg-gray-700')
             }`}
           >
             <Eye className={`w-4 h-4 mr-1 ${isDark ? 'text-white' : 'text-black'}`} />
             {canVote ? 'Vote' : 'View'}
           </Link>
         )
       }
     }
   ]
 
   const activePolls = polls.filter(poll => poll.status === 'active')
   const closedPolls = polls.filter(poll => poll.status === 'closed')
 
   const refreshPolls = async () => {
     setLoading(true)
     try {
       const response = await fetch('/api/polls')
       if (response.ok) {
         const data = await response.json()
         setPolls(data.polls || [])
       }
     } catch (error) {
       console.error('Failed to refresh polls:', error)
     } finally {
       setLoading(false)
     }
     // Refresh header and sidebar data
     refreshHeaderAndSidebar()
   }
 
   return (
     <div className={`space-y-6 ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
       {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
             Community Polls
           </h1>
           <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} mt-1`}>
             Participate in community decision making
           </p>
         </div>
         <button
           onClick={refreshPolls}
           disabled={loading}
           title="Refresh polls"
           className={`p-2 rounded-md transition-colors ${
             isDark
               ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
               : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
           } ${loading ? 'animate-spin' : ''}`}
         >
           <ArrowPathIcon className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
         </button>
       </div>
 
       {/* Stats */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className={`rounded-xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
           <div className="flex items-center">
             <PieChart className={`w-8 h-8 mr-3 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
             <div>
               <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Polls</p>
               <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{activePolls.length}</p>
             </div>
           </div>
         </div>
 
         <div className={`rounded-xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
           <div className="flex items-center">
             <Users className={`w-8 h-8 mr-3 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
             <div>
               <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>My Votes</p>
               <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                 {polls.filter(poll => poll.user_voted).length}
               </p>
             </div>
           </div>
         </div>
 
         <div className={`rounded-xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
           <div className="flex items-center">
             <Clock className={`w-8 h-8 mr-3 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
             <div>
               <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Closing Soon</p>
               <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                 {activePolls.filter(poll =>
                   poll.deadline &&
                   new Date(poll.deadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
                 ).length}
               </p>
             </div>
           </div>
         </div>
       </div>
 
       {/* Active Polls */}
       <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
         <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
           <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
             Active Polls
           </h2>
           <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
             Polls you can currently vote on
           </p>
         </div>
 
         {activePolls.length === 0 && !loading ? (
           <EmptyState
             title="No active polls"
             description="There are no polls available for voting at the moment"
             icon={PieChart}
           />
         ) : (
           <DataTable
             data={activePolls}
             columns={columns}
             loading={loading}
             emptyMessage="No active polls"
           />
         )}
       </div>
 
       {/* Closed Polls */}
       {closedPolls.length > 0 && (
         <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
           <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
             <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
               Past Polls
             </h2>
             <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
               View results from closed polls
             </p>
           </div>
 
           <DataTable
             data={closedPolls}
             columns={columns}
             emptyMessage="No past polls"
           />
         </div>
       )}
     </div>
   )
 }