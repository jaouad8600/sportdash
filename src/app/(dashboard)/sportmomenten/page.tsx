'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Plus, CalendarDays, Clock, Activity, XCircle, AlertCircle, Dumbbell, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TaskStatus = 'PENDING' | 'COMPLETED' | 'REFUSED';

interface Task {
  id: string;
  title: string;
  time: string;
  status: TaskStatus;
  type: 'SPORT' | 'EXTRA_SPORT' | 'INDICATION' | 'RESTRICTION' | 'MUTATION';
  details?: string;
}

import { getDailySchedule } from '@/lib/schedules';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

const INITIAL_TASKS: Task[] = [];

export default function SportMomentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [contextItems, setContextItems] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [newTask, setNewTask] = useState<any>({
    groupId: '',
    date: selectedDate,
    startTime: '',
    endTime: '',
    location: '',
    title: ''
  });
  const [formError, setFormError] = useState('');

  // Fetch groups for dropdown
  useEffect(() => {
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const res = await fetch('/api/groepen');
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching groups', error);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        const [mutRes, indRes, restRes, sportRes] = await Promise.all([
          fetch('/api/mutaties?activeOnly=true'),
          fetch('/api/indicaties?activeOnly=true'),
          fetch('/api/restrictions'),
          fetch('/api/sportmomenten')
        ]);

        const mutations = await mutRes.json();
        const indications = await indRes.json();
        const restrictions = await restRes.json();
        const sportMomenten = await sportRes.json();

        const schedule = getDailySchedule(new Date(selectedDate));
        const dateObj = new Date(selectedDate);

        // Map Schedule
        const mappedTasks: Task[] = schedule.map(s => {
          let location: string = s.location;
          if (location.includes('Langverblijf - Vloed')) location = 'Vloed';
          if (location.includes('Eb (oudbouw)')) location = 'Eb';

          let title = `${s.activity} (${location})`;
          if (s.activity.includes('Rust halfuur')) {
            title = 'Pauze';
          }

          let type: 'SPORT' | 'EXTRA_SPORT' | 'INDICATION' = 'SPORT';
          if (s.activity.toLowerCase().includes('extra')) type = 'EXTRA_SPORT';
          if (s.activity.toLowerCase().includes('indicatie')) type = 'INDICATION';

          return {
            id: s.id,
            title: title,
            time: s.startTime,
            status: 'PENDING',
            type: type
          };
        });

        // Map custom sportmomenten from API
        const customSportMomenten = Array.isArray(sportMomenten?.items)
          ? sportMomenten.items
            .filter((m: any) => m.date === selectedDate)
            .map((m: any) => {
              const group = groups.find(g => g.id === m.groupId);
              return {
                id: m.id,
                title: m.title || `${group?.naam || 'Groep'} - ${m.location || 'Sport'}`,
                time: `${m.startTime} - ${m.endTime}`,
                status: m.status || 'PENDING',
                type: m.type || 'SPORT',
                details: m.location ? `Locatie: ${m.location}` : undefined
              };
            })
          : [];

        // Helper to check overlap
        const checkOverlap = (start: Date, end: Date, dayStart: Date, dayEnd: Date) => {
          return start <= dayEnd && end >= dayStart;
        };

        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(selectedDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Map Mutations
        const activeMutations = Array.isArray(mutations) ? mutations.filter((m: any) => {
          const start = new Date(m.startDate);
          const end = m.endDate ? new Date(m.endDate) : new Date(2100, 0, 1);
          return checkOverlap(start, end, dayStart, dayEnd);
        }).map((m: any) => ({
          id: m.id,
          title: `Mutatie: ${m.reason} (${m.group?.name || 'Onbekend'})`,
          time: 'Hele dag',
          status: 'PENDING',
          type: 'MUTATION',
          details: m.youth ? `Jongere: ${m.youth.firstName} ${m.youth.lastName}` : undefined
        })) : [];

        // Map Indications
        const activeIndications = Array.isArray(indications) ? indications.filter((i: any) => {
          const start = new Date(i.validFrom);
          const end = i.validUntil ? new Date(i.validUntil) : new Date(2100, 0, 1);
          return checkOverlap(start, end, dayStart, dayEnd);
        }).map((i: any) => ({
          id: i.id,
          title: `Indicatie: ${i.description} (${i.group?.name || 'Onbekend'})`,
          time: 'Hele dag',
          status: 'PENDING',
          type: 'INDICATION',
          details: i.youth ? `Jongere: ${i.youth.firstName} ${i.youth.lastName}` : undefined
        })) : [];

        // Map Restrictions
        const activeRestrictions = Array.isArray(restrictions) ? restrictions.filter((r: any) => {
          const start = new Date(r.startDate);
          const end = new Date(r.endDate);
          return checkOverlap(start, end, dayStart, dayEnd);
        }).map((r: any) => ({
          id: r.id,
          title: `Beperking: ${r.youth?.firstName || 'Jongere'} (${r.group?.name || 'Groep'})`,
          time: 'Hele dag',
          status: 'PENDING',
          type: 'RESTRICTION',
          details: "Mag niet deelnemen aan sport"
        })) : [];

        setTasks([...customSportMomenten, ...mappedTasks] as Task[]);
        setContextItems([...activeRestrictions, ...activeMutations, ...activeIndications] as Task[]);

      } catch (error) {
        console.error("Error fetching data", error);
        // Fallback to just schedule
        const schedule = getDailySchedule(new Date(selectedDate));
        // ... map schedule ...
      }
    };

    fetchAdditionalData();
  }, [selectedDate, groups]);

  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validatie
    if (!newTask.groupId) {
      setFormError('Selecteer een groep');
      return;
    }
    if (!newTask.startTime) {
      setFormError('Vul een starttijd in');
      return;
    }
    if (!newTask.endTime) {
      setFormError('Vul een eindtijd in');
      return;
    }

    // Valideer tijden
    const startMinutes = timeToMinutes(newTask.startTime);
    const endMinutes = timeToMinutes(newTask.endTime);
    if (endMinutes <= startMinutes) {
      setFormError('Eindtijd moet na starttijd liggen');
      return;
    }

    try {
      const res = await fetch('/api/sportmomenten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: newTask.groupId,
          date: newTask.date || selectedDate,
          startTime: newTask.startTime,
          endTime: newTask.endTime,
          location: newTask.location,
          title: newTask.title,
          type: 'SPORT'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Er is een fout opgetreden');
        return;
      }

      // Success - refresh data
      setIsModalOpen(false);
      setNewTask({
        groupId: '',
        date: selectedDate,
        startTime: '',
        endTime: '',
        location: '',
        title: ''
      });

      // Trigger refresh
      const event = new Event('sportmoment-added');
      window.dispatchEvent(event);

      // Reload page data
      window.location.reload();

    } catch (error) {
      console.error('Error saving sportmoment', error);
      setFormError('Er is een fout opgetreden bij het opslaan');
    }
  };

  // Helper functie
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const refusedCount = tasks.filter(t => t.status === 'REFUSED').length;
  const totalProcessed = completedCount + refusedCount;
  const progress = Math.round((totalProcessed / tasks.length) * 100) || 0;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SPORT': return 'Sport';
      case 'EXTRA_SPORT': return 'Extra sport';
      case 'INDICATION': return 'Indicatie';
      case 'MUTATION': return 'Mutatie';
      case 'RESTRICTION': return 'Beperking';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SPORT': return 'bg-blue-50 text-blue-700';
      case 'EXTRA_SPORT': return 'bg-green-50 text-green-700';
      case 'INDICATION': return 'bg-purple-50 text-purple-700';
      case 'MUTATION': return 'bg-orange-50 text-orange-700';
      case 'RESTRICTION': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SPORT': return <Dumbbell size={14} />;
      case 'EXTRA_SPORT': return <Plus size={14} />;
      case 'INDICATION': return <Activity size={14} />;
      case 'MUTATION': return <Activity size={14} />;
      case 'RESTRICTION': return <XCircle size={14} />;
      default: return <Activity size={14} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dagplanning</h1>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-gray-500 font-medium bg-transparent outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-medium"
        >
          <Plus size={20} />
          <span>Nieuw Moment</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-2">
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="text-4xl font-bold text-gray-900">{progress}%</span>
              <span className="text-gray-500 ml-2 font-medium">afgehandeld</span>
            </div>
            <span className="text-sm text-gray-500 font-medium">{totalProcessed} van {tasks.length} taken</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-sm"
            />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Voltooid</span>
            <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg">{completedCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Geweigerd</span>
            <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded-lg">{refusedCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Openstaand</span>
            <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-lg">{tasks.length - totalProcessed}</span>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                group flex flex-col md:flex-row md:items-center gap-4 p-5 bg-white rounded-2xl border transition-all
                ${task.status === 'COMPLETED' ? 'border-green-100 bg-green-50/30' : ''}
                ${task.status === 'REFUSED' ? 'border-red-100 bg-red-50/30' : ''}
                ${task.status === 'PENDING' ? 'border-gray-100 hover:border-blue-200 hover:shadow-md' : ''}
              `}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className={`font-bold text-lg truncate ${task.status !== 'PENDING' ? 'text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  {task.status === 'REFUSED' && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">Geweigerd</span>
                  )}
                  {task.status === 'COMPLETED' && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Voltooid</span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                    <Clock size={14} className="text-blue-500" />
                    {task.time}
                  </span>
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-medium text-xs uppercase tracking-wide ${getTypeColor(task.type)}`}>
                    {getTypeIcon(task.type)}
                    {getTypeLabel(task.type)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 md:border-l md:pl-4 md:border-gray-100">
                <button
                  onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                  className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[80px]
                        ${task.status === 'COMPLETED'
                      ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                      : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'
                    }
                    `}
                >
                  <CheckCircle size={20} />
                  <span className="text-[10px] font-bold">Voltooid</span>
                </button>

                <button
                  onClick={() => handleStatusChange(task.id, 'REFUSED')}
                  className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[80px]
                        ${task.status === 'REFUSED'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                      : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600'
                    }
                    `}
                >
                  <XCircle size={20} />
                  <span className="text-[10px] font-bold">Weigeren</span>
                </button>

                {task.status !== 'PENDING' && (
                  <button
                    onClick={() => handleStatusChange(task.id, 'PENDING')}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Reset status"
                  >
                    <AlertCircle size={20} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Nieuw Sportmoment</h2>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5">
                {/* Groep - Verplicht */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Groep <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newTask.groupId}
                    onChange={e => setNewTask({ ...newTask, groupId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-all"
                    disabled={loadingGroups}
                  >
                    <option value="">Selecteer een groep...</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.naam || group.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Datum - Verplicht */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Datum <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newTask.date}
                    onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-all"
                  />
                </div>

                {/* Tijden - Verplicht */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Starttijd <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={newTask.startTime}
                      onChange={e => setNewTask({ ...newTask, startTime: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all"
                      placeholder="17:45"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Eindtijd <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={newTask.endTime}
                      onChange={e => setNewTask({ ...newTask, endTime: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all"
                      placeholder="18:30"
                    />
                  </div>
                </div>

                {/* Locatie - Optioneel */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Locatie (optioneel)
                  </label>
                  <select
                    value={newTask.location}
                    onChange={e => setNewTask({ ...newTask, location: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all"
                  >
                    <option value="">Geen specifieke locatie</option>
                    <option value="Sportzaal EB">Sportzaal EB</option>
                    <option value="Sportzaal Vloed">Sportzaal Vloed</option>
                    <option value="Fitness EB">Fitness EB</option>
                    <option value="Fitness Vloed">Fitness Vloed</option>
                    <option value="Dojo">Dojo</option>
                    <option value="Sportveld EB">Sportveld EB</option>
                    <option value="Sportveld Vloed">Sportveld Vloed</option>
                    <option value="Overig">Overig</option>
                  </select>
                </div>

                {/* Beschrijving - Optioneel */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Beschrijving (optioneel)
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-all"
                    placeholder="Bijv. Zaalvoetbal toernooi"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setFormError('');
                    }}
                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    Toevoegen
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
