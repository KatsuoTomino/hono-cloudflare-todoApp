import { useState } from 'react'
import { authClient } from '../lib/auth-client'

type LoginProps = {
  onLoginSuccess: () => void
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isSignup) {
        await authClient.signUp.email({
          email,
          password,
          name: name || email.split('@')[0],
        })
      } else {
        await authClient.signIn.email({
          email,
          password,
        })
      }
      
      // Cookieが設定されるのを待つ
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // セッションを確認
      const session = await authClient.getSession()
      
      if (session?.data) {
        onLoginSuccess()
      } else {
        setError('ログインに成功しましたが、セッションの取得に失敗しました。ページをリロードしてください。')
      }
    } catch (err: any) {
      setError(err.message || err.error?.message || 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          {isSignup ? 'サインアップ' : 'ログイン'}
        </h1>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
       <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                名前
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '処理中...' : isSignup ? 'サインアップ' : 'ログイン'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignup(!isSignup)
            setError('')
          }}
          className="mt-4 w-full text-sm text-blue-500 hover:text-blue-700"
        >
          {isSignup ? '既にアカウントをお持ちですか？ログイン' : 'アカウントをお持ちでない方はサインアップ'}
        </button>
      </div>
    </div>
  )
}