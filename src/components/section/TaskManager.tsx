'use client';

import { Section } from '@components/layout';
import { TaskManagerStyles } from '@styles/section';
import { useEffect, useMemo, useState } from 'react';

type Status = 'todo' | 'in-progress' | 'done';
type Priority = 'low' | 'medium' | 'high';

interface TaskItem {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  notes: string;
  createdAt: number;
}

const STORAGE_KEY = 'tool-task-manager-items';

const readInitialItems = (): TaskItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TaskItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function TaskManager() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<TaskItem[]>(() => readInitialItems());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const summary = useMemo(
    () => ({
      todo: items.filter((item) => item.status === 'todo').length,
      inProgress: items.filter((item) => item.status === 'in-progress').length,
      done: items.filter((item) => item.status === 'done').length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items
      .filter((item) => (filter === 'all' ? true : item.status === filter))
      .filter((item) => {
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.notes.toLowerCase().includes(q) ||
          item.priority.includes(q)
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [items, filter, query]);

  const addTask = () => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;

    setItems((current) => [
      {
        id: crypto.randomUUID(),
        title: normalizedTitle,
        status: 'todo',
        priority,
        dueDate,
        notes: notes.trim(),
        createdAt: Date.now(),
      },
      ...current,
    ]);

    setTitle('');
    setNotes('');
    setDueDate('');
    setPriority('medium');
  };

  const updateTask = (id: string, update: Partial<TaskItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...update } : item)),
    );
  };

  const removeTask = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <Section
      id='task-manager'
      className={TaskManagerStyles.TaskManager}
    >
      <header className={TaskManagerStyles.Topbar}>
        <div className={TaskManagerStyles.Header}>
          <h2 className={TaskManagerStyles.Title}>Task Manager</h2>
          <p className={TaskManagerStyles.Subtitle}>
            Track editorial and engineering tasks.
          </p>
        </div>

        <div className={TaskManagerStyles.Summary}>
          <span>Todo: {summary.todo}</span>
          <span>In Progress: {summary.inProgress}</span>
          <span>Done: {summary.done}</span>
        </div>
      </header>

      <div className={TaskManagerStyles.Workspace}>
        <section className={TaskManagerStyles.CreatePanel}>
          <div className={TaskManagerStyles.Create}>
            <input
              className={TaskManagerStyles.Input}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder='Task title'
              aria-label='Task title'
            />
            <select
              className={TaskManagerStyles.Select}
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority)}
              aria-label='Priority'
            >
              <option value='low'>Low</option>
              <option value='medium'>Medium</option>
              <option value='high'>High</option>
            </select>
            <input
              className={TaskManagerStyles.Input}
              type='date'
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-label='Due date'
            />
            <textarea
              className={TaskManagerStyles.Textarea}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder='Notes (optional)'
              rows={4}
            />
            <button
              className={TaskManagerStyles.Button}
              type='button'
              onClick={addTask}
            >
              Add Task
            </button>
          </div>
        </section>

        <section className={TaskManagerStyles.ListPanel}>
          <div className={TaskManagerStyles.Filters}>
            <select
              className={TaskManagerStyles.Select}
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as Status | 'all')
              }
              aria-label='Status filter'
            >
              <option value='all'>All</option>
              <option value='todo'>Todo</option>
              <option value='in-progress'>In Progress</option>
              <option value='done'>Done</option>
            </select>
            <input
              className={TaskManagerStyles.Input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search tasks'
              aria-label='Search tasks'
            />
          </div>

          <div className={TaskManagerStyles.List}>
            {filtered.length === 0 && (
              <p className={TaskManagerStyles.Empty}>No tasks found.</p>
            )}

            {filtered.map((item) => (
              <article
                key={item.id}
                className={TaskManagerStyles.Item}
              >
                <div className={TaskManagerStyles.ItemHeader}>
                  <input
                    className={TaskManagerStyles.Input}
                    value={item.title}
                    onChange={(event) =>
                      updateTask(item.id, { title: event.target.value })
                    }
                    aria-label='Task title'
                  />
                  <button
                    className={TaskManagerStyles.Button}
                    type='button'
                    onClick={() => removeTask(item.id)}
                  >
                    Delete
                  </button>
                </div>

                <div className={TaskManagerStyles.Row}>
                  <select
                    className={TaskManagerStyles.Select}
                    value={item.status}
                    onChange={(event) =>
                      updateTask(item.id, {
                        status: event.target.value as Status,
                      })
                    }
                    aria-label='Task status'
                  >
                    <option value='todo'>Todo</option>
                    <option value='in-progress'>In Progress</option>
                    <option value='done'>Done</option>
                  </select>

                  <select
                    className={TaskManagerStyles.Select}
                    value={item.priority}
                    onChange={(event) =>
                      updateTask(item.id, {
                        priority: event.target.value as Priority,
                      })
                    }
                    aria-label='Task priority'
                  >
                    <option value='low'>Low</option>
                    <option value='medium'>Medium</option>
                    <option value='high'>High</option>
                  </select>

                  <input
                    className={TaskManagerStyles.Input}
                    type='date'
                    value={item.dueDate}
                    onChange={(event) =>
                      updateTask(item.id, { dueDate: event.target.value })
                    }
                    aria-label='Task due date'
                  />
                </div>

                <textarea
                  className={TaskManagerStyles.Textarea}
                  value={item.notes}
                  onChange={(event) =>
                    updateTask(item.id, { notes: event.target.value })
                  }
                  rows={2}
                  placeholder='Task notes'
                />
              </article>
            ))}
          </div>
        </section>
      </div>
    </Section>
  );
}
