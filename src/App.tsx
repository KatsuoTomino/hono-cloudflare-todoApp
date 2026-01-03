import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTodos, createTodo, updateTodo, deleteTodo, type Todo, type CreateTodoRequest } from './api/client'
import { authClient } from './lib/auth-client'
import { Login } from './components/Login'

function App() {
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // 認証状態をチェックする関数
  const checkAuth = async () => {
    try {
      const session = await authClient.getSession()
      const authenticated = !!session?.data
      setIsAuthenticated(authenticated)
      return authenticated
    } catch (error) {
      setIsAuthenticated(false)
      return false
    } finally {
      setIsCheckingAuth(false)
    }
  }

  // 初回認証チェック
  useEffect(() => {
    checkAuth()
  }, [])

  // ログイン成功時のハンドラー
  const handleLoginSuccess = async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    const authenticated = await checkAuth()
    
    if (authenticated) {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    }
  }

  // 全件取得（認証済みの場合のみ）
  const { data: todos = [], isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
    enabled: isAuthenticated && !isCheckingAuth,
    retry: false,
  })

  // Todo作成
  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setNewTodoTitle('')
    },
  })

  // Todo更新
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateTodoRequest }) => updateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setEditingId(null)
      setEditTitle('')
    },
  })

  // Todo削除
  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTodoTitle.trim()) {
      createMutation.mutate({ title: newTodoTitle.trim() })
    }
  }

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
  }

  const handleSaveEdit = (id: number) => {
    if (editTitle.trim()) {
      const todo = todos.find(t => t.id === id)
      if (todo) {
        updateMutation.mutate({ 
          id, 
          data: { title: editTitle.trim(), status: todo.status } 
        })
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleToggleComplete = (todo: Todo) => {
    const newStatus = todo.status === 'done' ? 'todo' : 'done'
    updateMutation.mutate({ 
      id: todo.id, 
      data: { title: todo.title, status: newStatus } 
    })
  }

  const handleDelete = (id: number): void => {
    if (confirm('このタスクを削除しますか？')) {
      deleteMutation.mutate(id)
    }
  }

  const handleLogout = async () => {
    try {
      await authClient.signOut()
    } catch (error) {
      // エラーは無視（既にログアウト状態にする）
    }
    setIsAuthenticated(false)
    setIsCheckingAuth(true)
    queryClient.clear()
    await checkAuth()
  }

  // 認証チェック中は何も表示しない
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">認証状態を確認中...</div>
      </div>
    )
  }

  // 未認証の場合はログイン画面を表示
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-red-500">エラーが発生しました: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Todo App</h1>
          <button
            onClick={handleLogout}
            className="rounded bg-gray-500 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-600"
          >
            ログアウト
          </button>
        </div>

        {/* Todo作成フォーム */}
        <form onSubmit={handleCreate} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Add a new task"
            className="flex-1 rounded border border-gray-300 px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {createMutation.isPending ? '追加中...' : 'Add'}
          </button>
        </form>

        {/* Todo一覧 */}
        <div className="space-y-2">
          {todos.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              タスクがありません
            </div>
          ) : (
            todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isEditing={editingId === todo.id}
                editTitle={editTitle}
                onEditTitleChange={setEditTitle}
                onEdit={() => handleEdit(todo)}
                onSave={() => handleSaveEdit(todo.id)}
                onCancel={handleCancelEdit}
                onToggleComplete={() => handleToggleComplete(todo)}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

type TodoItemProps = {
  todo: Todo
  isEditing: boolean
  editTitle: string
  onEditTitleChange: (title: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onToggleComplete: () => void
  onDelete: (id: number) => void
}

function TodoItem({
  todo,
  isEditing,
  editTitle,
  onEditTitleChange,
  onEdit,
  onSave,
  onCancel,
  onToggleComplete,
  onDelete,
}: TodoItemProps) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2 rounded border border-gray-200 p-3">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSave()
            } else if (e.key === 'Escape') {
              onCancel()
            }
          }}
        />
        <button
          onClick={onSave}
          className="rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
        >
          保存
        </button>
        <button
          onClick={onCancel}
          className="rounded bg-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-400"
        >
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded border border-gray-200 p-3 hover:bg-gray-50">
      {/* チェックボックス */}
      <input
        type="checkbox"
        checked={todo.status === 'done'}
        onChange={onToggleComplete}
        className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500"
      />

      {/* Todoテキスト */}
      <span
        className={`flex-1 text-gray-700 ${
          todo.status === 'done' ? 'line-through text-gray-400' : ''
        }`}
      >
        {todo.title}
      </span>

      {/* 編集ボタン */}
      <button
        onClick={onEdit}
        className="flex h-8 w-8 items-center justify-center rounded bg-blue-500 text-white transition-colors hover:bg-blue-600"
        title="編集"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>

      {/* 削除ボタン */}
      <button
        onClick={() => onDelete(todo.id)}
        className="flex h-8 w-8 items-center justify-center rounded bg-red-500 text-white transition-colors hover:bg-red-600"
        title="削除"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  )
}

export default App