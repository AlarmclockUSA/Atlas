'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash, Plus, X } from 'lucide-react'
import { createScenario, updateScenario, deleteScenario, getScenarios, type Scenario } from '@/lib/firebaseUtils'
import { toast } from 'sonner'

type EditingScenario = Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const
const INITIAL_SCENARIO: EditingScenario = {
  title: '',
  description: '',
  difficulty: 'Beginner',
  category: '',
  agentId: '',
  agentName: '',
  objectives: []
}

export function ScenarioManagement() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingScenario, setEditingScenario] = useState<EditingScenario>(INITIAL_SCENARIO)
  const [newObjective, setNewObjective] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadScenarios()
  }, [])

  async function loadScenarios() {
    try {
      const fetchedScenarios = await getScenarios()
      setScenarios(fetchedScenarios)
    } catch (error) {
      console.error('Error loading scenarios:', error)
      toast.error('Failed to load scenarios')
    }
  }

  function startNewScenario() {
    setEditingScenario(INITIAL_SCENARIO)
    setIsEditing(true)
  }

  function startEditingScenario(scenario: Scenario) {
    setEditingScenario({
      title: scenario.title,
      description: scenario.description,
      difficulty: scenario.difficulty,
      category: scenario.category,
      agentId: scenario.agentId,
      agentName: scenario.agentName,
      objectives: scenario.objectives,
      id: scenario.id
    })
    setIsEditing(true)
  }

  function addObjective() {
    if (newObjective.trim()) {
      setEditingScenario(prev => ({
        ...prev,
        objectives: [...(prev.objectives || []), newObjective.trim()]
      }))
      setNewObjective('')
    }
  }

  function removeObjective(index: number) {
    setEditingScenario(prev => ({
      ...prev,
      objectives: (prev.objectives || []).filter((_, i) => i !== index)
    }))
  }

  async function saveScenario() {
    try {
      setIsLoading(true)
      
      // Validate required fields
      if (!editingScenario.title || !editingScenario.description || !editingScenario.agentId || !editingScenario.agentName) {
        toast.error('Please fill in all required fields')
        return
      }

      if (editingScenario.id) {
        await updateScenario(editingScenario.id, editingScenario)
        toast.success('Scenario updated successfully')
      } else {
        await createScenario(editingScenario)
        toast.success('Scenario created successfully')
      }
      await loadScenarios()
      setIsEditing(false)
      setEditingScenario(INITIAL_SCENARIO)
    } catch (error) {
      console.error('Error saving scenario:', error)
      toast.error('Failed to save scenario')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteScenario(id: string) {
    if (!window.confirm('Are you sure you want to delete this scenario?')) return
    
    try {
      setIsLoading(true)
      await deleteScenario(id)
      toast.success('Scenario deleted successfully')
      await loadScenarios()
    } catch (error) {
      console.error('Error deleting scenario:', error)
      toast.error('Failed to delete scenario')
    } finally {
      setIsLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{editingScenario.id ? 'Edit' : 'New'} Scenario</h2>
          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
        
        <div className="space-y-4">
          <Input
            placeholder="Title"
            value={editingScenario.title}
            onChange={e => setEditingScenario(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          
          <Textarea
            placeholder="Description"
            value={editingScenario.description}
            onChange={e => setEditingScenario(prev => ({ ...prev, description: e.target.value }))}
            required
          />
          
          <Select
            value={editingScenario.difficulty}
            onValueChange={value => setEditingScenario(prev => ({ ...prev, difficulty: value as typeof DIFFICULTY_LEVELS[number] }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Category"
            value={editingScenario.category}
            onChange={e => setEditingScenario(prev => ({ ...prev, category: e.target.value }))}
            required
          />
          
          <Input
            placeholder="Agent ID"
            value={editingScenario.agentId}
            onChange={e => setEditingScenario(prev => ({ ...prev, agentId: e.target.value }))}
            required
          />
          
          <Input
            placeholder="Agent Name"
            value={editingScenario.agentName}
            onChange={e => setEditingScenario(prev => ({ ...prev, agentName: e.target.value }))}
            required
          />
          
          <div className="space-y-2">
            <h3 className="font-medium">Objectives</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Add new objective"
                value={newObjective}
                onChange={e => setNewObjective(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addObjective()}
              />
              <Button onClick={addObjective}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {editingScenario.objectives?.map((objective, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-secondary rounded-md">{objective}</div>
                  <Button variant="ghost" size="sm" onClick={() => removeObjective(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          <Button onClick={saveScenario} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Scenario'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Scenarios</h2>
        <Button onClick={startNewScenario}>Add New Scenario</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map(scenario => (
          <Card key={scenario.id} className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{scenario.title}</h3>
                <p className="text-muted-foreground">{scenario.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => startEditingScenario(scenario)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteScenario(scenario.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Badge>{scenario.difficulty}</Badge>
              <Badge variant="outline">{scenario.category}</Badge>
            </div>
            
            <div>
              <p className="text-sm font-medium">Agent: {scenario.agentName}</p>
              <p className="text-sm text-muted-foreground">ID: {scenario.agentId}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Objectives:</h4>
              <ul className="list-disc list-inside space-y-1">
                {scenario.objectives?.map((objective, index) => (
                  <li key={index} className="text-sm text-muted-foreground">{objective}</li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 