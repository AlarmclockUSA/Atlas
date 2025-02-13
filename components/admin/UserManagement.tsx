'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle, Mail, Trash, Pencil, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from 'sonner'
import { sendPasswordResetEmail } from 'firebase/auth'

interface User {
  id: string
  email: string
  displayName: string
  role: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ email: '', displayName: '', role: '' })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resetPasswordLoading, setResetPasswordLoading] = useState<string | null>(null)
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const usersCollection = collection(db, 'Users')
      const userSnapshot = await getDocs(usersCollection)
      const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User))
      setUsers(userList)
      toast.success('Users loaded successfully')
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users. Please try again.')
      toast.error('Failed to load users')
    }
    setLoading(false)
  }

  const addUser = async () => {
    setError(null)
    toast.promise(
      async () => {
        await addDoc(collection(db, 'PendingUsers'), {
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role,
          createdAt: new Date()
        })
        setNewUser({ email: '', displayName: '', role: '' })
        fetchUsers()
      },
      {
        loading: 'Creating user invitation...',
        success: 'User invitation created successfully',
        error: 'Failed to create user invitation'
      }
    )
  }

  const updateUser = async (userId: string, data: Partial<User>) => {
    setError(null)
    toast.promise(
      async () => {
        const userRef = doc(db, 'Users', userId)
        await updateDoc(userRef, data)
        setEditingUser(null)
        fetchUsers()
      },
      {
        loading: 'Updating user...',
        success: 'User updated successfully',
        error: 'Failed to update user'
      }
    )
  }

  const sendPasswordReset = async (email: string) => {
    setError(null)
    setResetPasswordLoading(email)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetPasswordSuccess(email)
      setTimeout(() => setResetPasswordSuccess(null), 2000) // Reset after 2 seconds
    } catch (error) {
      console.error('Error sending password reset:', error)
      setError('Failed to send password reset email. Please try again.')
    } finally {
      setResetPasswordLoading(null)
    }
  }

  const deleteUserAccount = async (userId: string) => {
    setError(null)
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    toast.promise(
      async () => {
        // Delete from Firestore
        await deleteDoc(doc(db, 'Users', userId))
        
        // Delete from Firebase Auth using API
        const token = await auth.currentUser?.getIdToken()
        const response = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId })
        })

        if (!response.ok) {
          throw new Error('Failed to delete user from authentication')
        }
        
        fetchUsers()
      },
      {
        loading: 'Deleting user account...',
        success: 'User account deleted successfully',
        error: 'Failed to delete user account'
      }
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading users...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">User Management</h2>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Dialog>
        <DialogTrigger asChild>
          <Button>Add New User</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={newUser.displayName}
                onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input
                id="role"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={addUser}>Add User</Button>
        </DialogContent>
      </Dialog>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {editingUser?.id === user.id ? (
                  <Input
                    value={editingUser.displayName}
                    onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  />
                ) : (
                  user.displayName
                )}
              </TableCell>
              <TableCell>
                {editingUser?.id === user.id ? (
                  <Input
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  />
                ) : (
                  user.role
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {editingUser?.id === user.id ? (
                    <>
                      <Button onClick={() => updateUser(user.id, editingUser)} size="sm">
                        Save
                      </Button>
                      <Button onClick={() => setEditingUser(null)} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setEditingUser(user)} variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        onClick={() => sendPasswordReset(user.email)}
                        variant={resetPasswordSuccess === user.email ? "success" : "outline"}
                        size="sm"
                        disabled={resetPasswordLoading === user.email}
                        className={resetPasswordSuccess === user.email ? "bg-green-500 hover:bg-green-600 text-white border-0" : ""}
                      >
                        {resetPasswordLoading === user.email ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-1" />
                            {resetPasswordSuccess === user.email ? 'Sent!' : 'Reset Password'}
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => deleteUserAccount(user.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

