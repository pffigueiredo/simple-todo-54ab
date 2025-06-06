import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit2, Plus } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function TodoApp() {
  // Explicit typing with Todo interface
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // Form state with proper typing for nullable fields
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null // Explicitly null, not undefined
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string | null;
  }>({
    title: '',
    description: null
  });

  // useCallback to memoize function used in useEffect
  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.createTodo.mutate(formData);
      // Update todos list with explicit typing in setState callback
      setTodos((prev: Todo[]) => [...prev, response]);
      // Reset form
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updateData: UpdateTodoInput = {
        id: todo.id,
        completed: !todo.completed
      };
      const response = await trpc.updateTodo.mutate(updateData);
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === todo.id ? response : t))
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async (todoId: number) => {
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditFormData({
      title: todo.title,
      description: todo.description
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editFormData.title.trim()) return;

    try {
      const updateData: UpdateTodoInput = {
        id: editingTodo.id,
        title: editFormData.title,
        description: editFormData.description
      };
      const response = await trpc.updateTodo.mutate(updateData);
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === editingTodo.id ? response : t))
      );
      setEditingTodo(null);
      setEditFormData({ title: '', description: null });
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setEditFormData({ title: '', description: null });
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-300">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 relative">
          {/* Theme Toggle */}
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300">✨ Todo App</h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Stay organized and get things done!</p>
          {totalCount > 0 && (
            <div className="flex justify-center gap-4 mt-4">
              <Badge variant="secondary" className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-300">
                📝 Total: {totalCount}
              </Badge>
              <Badge variant="default" className="text-sm bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 transition-colors duration-300">
                ✅ Completed: {completedCount}
              </Badge>
              <Badge variant="outline" className="text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                ⏳ Remaining: {totalCount - completedCount}
              </Badge>
            </div>
          )}
        </div>

        {/* Add Todo Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-colors duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100 transition-colors duration-300">
              <Plus className="h-5 w-5" />
              Add New Todo
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
              Create a new task to keep track of your goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="What needs to be done? 🎯"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                required
                className="text-lg bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors duration-300"
              />
              <Textarea
                placeholder="Add a description (optional) 📝"
                // Handle nullable field with fallback to empty string
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null // Convert empty string back to null
                  }))
                }
                rows={3}
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors duration-300"
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 transition-all duration-300">
                {isLoading ? '✨ Creating...' : '🚀 Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todos List */}
        {todos.length === 0 ? (
          <Card className="text-center py-12 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-colors duration-300">
            <CardContent>
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">No todos yet!</h3>
              <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Create your first todo above to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {todos.map((todo: Todo) => (
              <Card key={todo.id} className={`shadow-lg border-0 transition-all duration-300 hover:shadow-xl ${
                todo.completed 
                  ? 'bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm border-l-4 border-l-green-400 dark:border-l-green-500' 
                  : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-l-4 border-l-blue-400 dark:border-l-blue-500'
              }`}>
                <CardContent className="p-6">
                  {editingTodo?.id === todo.id ? (
                    // Edit Form
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <Input
                        value={editFormData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditFormData((prev) => ({ ...prev, title: e.target.value }))
                        }
                        required
                        className="text-lg font-semibold bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 transition-colors duration-300"
                      />
                      <Textarea
                        value={editFormData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            description: e.target.value || null
                          }))
                        }
                        rows={3}
                        placeholder="Description (optional)"
                        className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors duration-300"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors duration-300">
                          ✅ Save
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300">
                          ❌ Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Display Todo
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => handleToggleComplete(todo)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                              todo.completed 
                                ? 'line-through text-gray-500 dark:text-gray-400' 
                                : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {todo.completed ? '✅' : '📋'} {todo.title}
                            </h3>
                            {/* Handle nullable description */}
                            {todo.description && (
                              <p className={`mt-1 transition-colors duration-300 ${
                                todo.completed 
                                  ? 'text-gray-400 dark:text-gray-500 line-through' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {todo.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(todo)}
                            className="hover:bg-blue-100 dark:hover:bg-blue-900/50 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-300">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-300">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-gray-800 dark:text-gray-200 transition-colors duration-300">Delete Todo</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                  Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(todo.id)}
                                  className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors duration-300"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <Separator className="my-3 bg-gray-200 dark:bg-gray-600 transition-colors duration-300" />
                      
                      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                        <span>📅 Created: {todo.created_at.toLocaleDateString()}</span>
                        <span>🔄 Updated: {todo.updated_at.toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TodoApp />
    </ThemeProvider>
  );
}

export default App;