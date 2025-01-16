'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users. Please try again.')
    }
    setLoading(false)
  }

  const addUser = async () => {
    setError(null)
    try {
      await addDoc(collection(db, 'Users'), newUser)
      setNewUser({ email: '', displayName: '', role: '' })
      fetchUsers()
    } catch (error) {
      console.error('Error adding user:', error)
      setError('Failed to add user. Please try again.')
    }
  }

  const updateUser = async (userId: string, data: Partial<User>) => {
    setError(null)
    try {
      const userRef = doc(db, 'Users', userId)
      await updateDoc(userRef, data)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      setError('Failed to update user. Please try again.')
    }
  }

  const deleteUser = async (userId: string) => {
    setError(null)
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'Users', userId))
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        setError('Failed to delete user. Please try again.')
      }
    }
  }

  if (loading) {
    return <div>Loading users...</div>
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
                {editingUser?.id === user.id ? (
                  <>
                    <Button onClick={() => updateUser(user.id, editingUser)} className="mr-2">Save</Button>
                    <Button onClick={() => setEditingUser(null)} variant="outline">Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setEditingUser(user)} className="mr-2">Edit</Button>
                    <Button onClick={() => deleteUser(user.id)} variant="destructive">Delete</Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

