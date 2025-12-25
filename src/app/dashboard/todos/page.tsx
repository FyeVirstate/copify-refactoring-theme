"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTodos } from "@/lib/hooks/use-todos";

export default function TodosPage() {
  const { 
    todos, 
    isLoading, 
    error, 
    fetchTodos, 
    createTodo, 
    toggleComplete, 
    deleteTodo 
  } = useTodos();

  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    setIsAdding(true);
    try {
      await createTodo({
        title: newTodoTitle.trim(),
        priority: newTodoPriority,
      });
      setNewTodoTitle("");
      setNewTodoPriority('medium');
    } catch (err) {
      console.error("Failed to add todo:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleComplete(id);
    } catch (err) {
      console.error("Failed to toggle todo:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTodo(id);
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.isCompleted;
    if (filter === 'completed') return todo.isCompleted;
    return true;
  });

  const activeTodosCount = todos.filter(t => !t.isCompleted).length;
  const completedTodosCount = todos.filter(t => t.isCompleted).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return priority;
    }
  };

  return (
    <>
      <DashboardHeader title="Liste de tâches" />

      <div className="bg-weak-50 home-content-wrapper">
        <div className="container py-4" style={{ maxWidth: 800 }}>
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-4"
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h4 className="mb-1">
                    <i className="ri-checkbox-circle-line me-2 text-primary"></i>
                    Ma liste de tâches
                  </h4>
                  <p className="text-muted mb-0">
                    {activeTodosCount} tâche{activeTodosCount > 1 ? 's' : ''} en cours
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <span className="badge bg-success">{completedTodosCount} terminée{completedTodosCount > 1 ? 's' : ''}</span>
                  <span className="badge bg-primary">{activeTodosCount} en cours</span>
                </div>
              </div>

              {/* Add Todo Form */}
              <form onSubmit={handleAddTodo} className="d-flex gap-2">
                <div className="flex-grow-1">
                  <Input
                    type="text"
                    placeholder="Ajouter une nouvelle tâche..."
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    disabled={isAdding}
                  />
                </div>
                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={newTodoPriority}
                  onChange={(e) => setNewTodoPriority(e.target.value as 'low' | 'medium' | 'high')}
                  disabled={isAdding}
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
                <Button type="submit" disabled={isAdding || !newTodoTitle.trim()}>
                  {isAdding ? (
                    <span className="rotating"><i className="ri-loader-2-line"></i></span>
                  ) : (
                    <i className="ri-add-line"></i>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Filter Tabs */}
          <div className="mb-3">
            <ul className="nav nav-pills">
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  Toutes ({todos.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'active' ? 'active' : ''}`}
                  onClick={() => setFilter('active')}
                >
                  En cours ({activeTodosCount})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilter('completed')}
                >
                  Terminées ({completedTodosCount})
                </button>
              </li>
            </ul>
          </div>

          {/* Todos List */}
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredTodos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-5"
            >
              <i className="ri-checkbox-circle-line fs-1 text-muted mb-3 d-block"></i>
              <h5>
                {filter === 'completed' 
                  ? "Aucune tâche terminée"
                  : filter === 'active'
                  ? "Aucune tâche en cours"
                  : "Aucune tâche"}
              </h5>
              <p className="text-muted">
                {filter === 'all' && "Ajoutez votre première tâche ci-dessus."}
              </p>
            </motion.div>
          ) : (
            <div className="d-flex flex-column gap-2">
              <AnimatePresence>
                {filteredTodos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                    className={`card ${todo.isCompleted ? 'bg-light' : ''}`}
                  >
                    <div className="card-body py-3">
                      <div className="d-flex align-items-center gap-3">
                        {/* Checkbox */}
                        <button
                          className={`btn btn-sm rounded-circle ${
                            todo.isCompleted ? 'btn-success' : 'btn-outline-secondary'
                          }`}
                          onClick={() => handleToggle(todo.id)}
                          style={{ width: 32, height: 32 }}
                        >
                          {todo.isCompleted && <i className="ri-check-line"></i>}
                        </button>

                        {/* Content */}
                        <div className="flex-grow-1">
                          <p 
                            className={`mb-0 fw-500 ${
                              todo.isCompleted ? 'text-decoration-line-through text-muted' : ''
                            }`}
                          >
                            {todo.title}
                          </p>
                          {todo.description && (
                            <small className="text-muted">{todo.description}</small>
                          )}
                        </div>

                        {/* Priority Badge */}
                        <span className={`badge bg-${getPriorityColor(todo.priority)}`}>
                          {getPriorityLabel(todo.priority)}
                        </span>

                        {/* Due Date */}
                        {todo.dueDate && (
                          <small className="text-muted">
                            <i className="ri-calendar-line me-1"></i>
                            {new Date(todo.dueDate).toLocaleDateString('fr-FR')}
                          </small>
                        )}

                        {/* Delete Button */}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(todo.id)}
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Clear Completed */}
          {completedTodosCount > 0 && filter !== 'active' && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm(`Supprimer ${completedTodosCount} tâche${completedTodosCount > 1 ? 's' : ''} terminée${completedTodosCount > 1 ? 's' : ''}?`)) {
                    todos
                      .filter(t => t.isCompleted)
                      .forEach(t => handleDelete(t.id));
                  }
                }}
              >
                <i className="ri-delete-bin-line me-1"></i>
                Supprimer les tâches terminées
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
