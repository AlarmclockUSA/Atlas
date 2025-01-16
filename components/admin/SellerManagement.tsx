'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle, Plus, Trash, Upload } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Comp {
  address: string
  soldDate: string
  price: string
  condition: string
  updates: string
  notes: string
}

interface Seller {
  id: string
  name: string
  description: string
  elevenLabsId: string
  imageUrl: string
  profilePictureUrl: string
  propertyInfo?: {
    address: string
    details: string[]
  }
  isPlaceholder?: boolean
  comps: Comp[]
  fileUrl?: string
}

export function SellerManagement() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newSeller, setNewSeller] = useState<Omit<Seller, 'id'>>({
    name: '',
    description: '',
    elevenLabsId: '',
    imageUrl: '',
    profilePictureUrl: '',
    propertyInfo: {
      address: '',
      details: []
    },
    comps: [],
    isPlaceholder: false
  })
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null)
  const [editingComp, setEditingComp] = useState<Comp | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchSellers()
  }, [])

  const fetchSellers = async () => {
    setLoading(true)
    setError(null)
    try {
      const sellersCollection = collection(db, 'Sellers')
      const sellerSnapshot = await getDocs(sellersCollection)
      const sellerList = sellerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        comps: doc.data().comps || []
      } as Seller))
      setSellers(sellerList)
    } catch (error) {
      console.error('Error fetching sellers:', error)
      setError('Failed to fetch sellers. Please try again.')
    }
    setLoading(false)
  }

  const addSeller = async (sellerData: Omit<Seller, 'id'> = newSeller) => {
    setError(null)
    try {
      await addDoc(collection(db, 'Sellers'), sellerData)
      setNewSeller({
        name: '',
        description: '',
        elevenLabsId: '',
        imageUrl: '',
        profilePictureUrl: '',
        propertyInfo: {
          address: '',
          details: []
        },
        comps: [],
        isPlaceholder: false
      })
      fetchSellers()
    } catch (error) {
      console.error('Error adding seller:', error)
      setError('Failed to add seller. Please try again.')
    }
  }

  const updateSeller = async (sellerId: string, data: Partial<Seller>) => {
    setError(null)
    try {
      const sellerRef = doc(db, 'Sellers', sellerId)
      const updatedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Partial<Seller>);
      await updateDoc(sellerRef, updatedData)
      setEditingSeller(null)
      fetchSellers()
    } catch (error) {
      console.error('Error updating seller:', error)
      setError('Failed to update seller. Please try again.')
    }
  }

  const deleteSeller = async (sellerId: string) => {
    setError(null)
    if (window.confirm('Are you sure you want to delete this seller?')) {
      try {
        await deleteDoc(doc(db, 'Sellers', sellerId))
        fetchSellers()
      } catch (error) {
        console.error('Error deleting seller:', error)
        setError('Failed to delete seller. Please try again.')
      }
    }
  }

  const addComp = (seller: Seller) => {
    const newComp: Comp = {
      address: '',
      soldDate: '',
      price: '',
      condition: '',
      updates: '',
      notes: ''
    }
    setEditingSeller({
      ...seller,
      comps: [...seller.comps, newComp]
    })
    setEditingComp(newComp)
  }

  const updateComp = (index: number, updatedComp: Comp) => {
    if (editingSeller) {
      const updatedComps = [...editingSeller.comps]
      updatedComps[index] = updatedComp
      setEditingSeller({
        ...editingSeller,
        comps: updatedComps
      })
    }
  }

  const deleteComp = (index: number) => {
    if (editingSeller) {
      const updatedComps = editingSeller.comps.filter((_, i) => i !== index)
      setEditingSeller({
        ...editingSeller,
        comps: updatedComps
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, sellerId: string, fileType: 'profilePicture' | 'propertyImage' | 'document') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const storage = getStorage();
    const storageRef = ref(storage, `sellers/${sellerId}/${fileType}/${file.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update the seller's document with the new file URL
      const sellerRef = doc(db, 'Sellers', sellerId);
      let updateData = {};
      switch (fileType) {
        case 'profilePicture':
          updateData = { profilePictureUrl: downloadURL };
          break;
        case 'propertyImage':
          updateData = { imageUrl: downloadURL };
          break;
        case 'document':
          updateData = { fileUrl: downloadURL };
          break;
      }
      await updateDoc(sellerRef, updateData);

      toast({
        title: "File uploaded successfully",
        description: `The ${fileType} has been uploaded and linked to the seller.`,
      })

      // Update the editingSeller state
      if (editingSeller) {
        setEditingSeller({
          ...editingSeller,
          ...updateData
        });
      }

      // Refresh the sellers list
      fetchSellers();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error uploading file",
        description: "There was a problem uploading the file. Please try again.",
        variant: "destructive",
      })
    }
  };

  if (loading) {
    return <div>Loading sellers...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Seller Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New Seller</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Seller</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newSeller.name}
                  onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newSeller.description}
                  onChange={(e) => setNewSeller({ ...newSeller, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="elevenLabsId" className="text-right">
                  Eleven Labs ID
                </Label>
                <Input
                  id="elevenLabsId"
                  value={newSeller.elevenLabsId}
                  onChange={(e) => setNewSeller({ ...newSeller, elevenLabsId: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUrl" className="text-right">
                  Property Image URL
                </Label>
                <Input
                  id="imageUrl"
                  value={newSeller.imageUrl}
                  onChange={(e) => setNewSeller({ ...newSeller, imageUrl: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="profilePictureUrl" className="text-right">
                  Profile Picture URL
                </Label>
                <Input
                  id="profilePictureUrl"
                  value={newSeller.profilePictureUrl}
                  onChange={(e) => setNewSeller({ ...newSeller, profilePictureUrl: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input
                  id="address"
                  value={newSeller.propertyInfo?.address || ''}
                  onChange={(e) => setNewSeller({ ...newSeller, propertyInfo: { ...(newSeller.propertyInfo || {}), address: e.target.value } })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="details" className="text-right">
                  Details
                </Label>
                <Textarea
                  id="details"
                  value={newSeller.propertyInfo?.details.join('\n') || ''}
                  onChange={(e) => setNewSeller({ ...newSeller, propertyInfo: { ...(newSeller.propertyInfo || {}), details: e.target.value.split('\n') } })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isPlaceholder" className="text-right">
                  Is Placeholder
                </Label>
                <Checkbox
                  id="isPlaceholder"
                  checked={newSeller.isPlaceholder || false}
                  onCheckedChange={(checked) => setNewSeller({ ...newSeller, isPlaceholder: checked })}
                />
              </div>
            </div>
            <Button onClick={() => addSeller()}>Add Seller</Button>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profile</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Eleven Labs ID</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Is Placeholder</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sellers.map((seller) => (
            <TableRow key={seller.id}>
              <TableCell>
                <Avatar>
                  <AvatarImage src={seller.profilePictureUrl} alt={seller.name} />
                  <AvatarFallback>{seller.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>{seller.name}</TableCell>
              <TableCell>{seller.description}</TableCell>
              <TableCell>{seller.elevenLabsId}</TableCell>
              <TableCell>{seller.propertyInfo?.address || 'N/A'}</TableCell>
              <TableCell>{seller.isPlaceholder ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Button onClick={() => setEditingSeller(seller)} className="mr-2">Edit</Button>
                <Button onClick={() => deleteSeller(seller.id)} variant="destructive">Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingSeller && (
        <Dialog open={true} onOpenChange={() => setEditingSeller(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Seller</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 py-4 px-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingSeller.name}
                    onChange={(e) => setEditingSeller({ ...editingSeller, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingSeller.description}
                    onChange={(e) => setEditingSeller({ ...editingSeller, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-elevenLabsId">Eleven Labs ID</Label>
                  <Input
                    id="edit-elevenLabsId"
                    value={editingSeller.elevenLabsId}
                    onChange={(e) => setEditingSeller({ ...editingSeller, elevenLabsId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <Tabs defaultValue="url">
                    <TabsList>
                      <TabsTrigger value="url">URL</TabsTrigger>
                      <TabsTrigger value="upload">Upload</TabsTrigger>
                    </TabsList>
                    <TabsContent value="url">
                      <Input
                        id="edit-profilePictureUrl"
                        value={editingSeller.profilePictureUrl}
                        onChange={(e) => setEditingSeller({ ...editingSeller, profilePictureUrl: e.target.value })}
                        placeholder="Enter profile picture URL"
                      />
                    </TabsContent>
                    <TabsContent value="upload">
                      <Input
                        id="profilePictureUpload"
                        type="file"
                        onChange={(e) => handleFileUpload(e, editingSeller.id, 'profilePicture')}
                      />
                    </TabsContent>
                  </Tabs>
                  {editingSeller.profilePictureUrl && (
                    <div className="mt-2">
                      <img src={editingSeller.profilePictureUrl} alt="Profile" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Property Image</Label>
                  <Tabs defaultValue="url">
                    <TabsList>
                      <TabsTrigger value="url">URL</TabsTrigger>
                      <TabsTrigger value="upload">Upload</TabsTrigger>
                    </TabsList>
                    <TabsContent value="url">
                      <Input
                        id="edit-imageUrl"
                        value={editingSeller.imageUrl}
                        onChange={(e) => setEditingSeller({ ...editingSeller, imageUrl: e.target.value })}
                        placeholder="Enter property image URL"
                      />
                    </TabsContent>
                    <TabsContent value="upload">
                      <Input
                        id="propertyImageUpload"
                        type="file"
                        onChange={(e) => handleFileUpload(e, editingSeller.id, 'propertyImage')}
                      />
                    </TabsContent>
                  </Tabs>
                  {editingSeller.imageUrl && (
                    <div className="mt-2">
                      <img src={editingSeller.imageUrl} alt="Property" className="w-40 h-24 object-cover rounded" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={editingSeller.propertyInfo?.address || ''}
                    onChange={(e) => setEditingSeller({ ...editingSeller, propertyInfo: { ...(editingSeller.propertyInfo || {}), address: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-details">Details</Label>
                  <Textarea
                    id="edit-details"
                    value={editingSeller.propertyInfo?.details.join('\n') || ''}
                    onChange={(e) => setEditingSeller({ ...editingSeller, propertyInfo: { ...(editingSeller.propertyInfo || {}), details: e.target.value.split('\n') } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-isPlaceholder">Is Placeholder</Label>
                  <Checkbox
                    id="edit-isPlaceholder"
                    checked={editingSeller.isPlaceholder || false}
                    onCheckedChange={(checked) => setEditingSeller({ ...editingSeller, isPlaceholder: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileUpload">Upload Document</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    onChange={(e) => handleFileUpload(e, editingSeller.id, 'document')}
                  />
                  {editingSeller.fileUrl && (
                    <div className="mt-2">
                      <a href={editingSeller.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        View uploaded document
                      </a>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Comps</h3>
                  {editingSeller.comps.map((comp, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded">
                      <div className="space-y-2">
                        <Label htmlFor={`comp-address-${index}`}>Address</Label>
                        <Input
                          id={`comp-address-${index}`}
                          value={comp.address}
                          onChange={(e) => updateComp(index, { ...comp, address: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`comp-soldDate-${index}`}>Sold Date</Label>
                        <Input
                          id={`comp-soldDate-${index}`}
                          value={comp.soldDate}
                          onChange={(e) => updateComp(index, { ...comp, soldDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`comp-price-${index}`}>Price</Label>
                        <Input
                          id={`comp-price-${index}`}
                          value={comp.price}
                          onChange={(e) => updateComp(index, { ...comp, price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`comp-condition-${index}`}>Condition</Label>
                        <Input
                          id={`comp-condition-${index}`}
                          value={comp.condition}
                          onChange={(e) => updateComp(index, { ...comp, condition: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`comp-updates-${index}`}>Updates</Label>
                        <Input
                          id={`comp-updates-${index}`}
                          value={comp.updates}
                          onChange={(e) => updateComp(index, { ...comp, updates: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`comp-notes-${index}`}>Notes</Label>
                        <Textarea
                          id={`comp-notes-${index}`}
                          value={comp.notes}
                          onChange={(e) => updateComp(index, { ...comp, notes: e.target.value })}
                        />
                      </div>
                      <Button
                        onClick={() => deleteComp(index)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Comp
                      </Button>
                    </div>
                  ))}
                  <Button onClick={() => addComp(editingSeller)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Comp
                  </Button>
                </div>
              </div>
            </ScrollArea>
            <Button onClick={() => {
              const { id, ...updatedData } = editingSeller;
              updateSeller(id, updatedData);
            }}>
              Save Changes
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

