const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

export type Todo = {
  id: number
  title: string
  status: 'todo' | 'doing' | 'done'
  createdAt: number
  updatedAt: number
}

export type CreateTodoRequest = {
  title: string
  status?: 'todo' | 'doing' | 'done'
}

export type UpdateTodoRequest = {
  title: string
  status?: 'todo' | 'doing' | 'done'
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: string
}

// 全件取得
export const getTodos = async (): Promise<Todo[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      credentials: 'include', // Cookieを送信するために必要
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.status === 401) {
      throw new Error('認証が必要です')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。')
    }
    throw error
  }
}

// Todo作成
export const createTodo = async (data: CreateTodoRequest): Promise<Todo> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data),
    credentials: 'include', // Cookieを送信するために必要
  })
  
  if (response.status === 401) {
    throw new Error('認証が必要です')
  }
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'タスクの作成に失敗しました')
  }
  
  const result: ApiResponse<Todo> = await response.json()
  return result.data!
}

// Todo更新
export const updateTodo = async (id: number, data: UpdateTodoRequest): Promise<Todo> => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data),
    credentials: 'include', // Cookieを送信するために必要
  })
  
  if (response.status === 401) {
    throw new Error('認証が必要です')
  }
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'タスクの更新に失敗しました')
  }
  
  const result: ApiResponse<Todo> = await response.json()
  return result.data!
}

// Todo削除
export const deleteTodo = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    credentials: 'include', // Cookieを送信するために必要
  })
  
  if (response.status === 401) {
    throw new Error('認証が必要です')
  }
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'タスクの削除に失敗しました')
  }
}