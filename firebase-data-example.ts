// This is an example of how Linda's data should be structured in Firebase
const lindaData = {
  id: ELEVENLABS_AGENT_ID, // Use the actual agent ID from ElevenLabs
  name: 'Linda Thompson',
  description: 'Single mother selling her family home',
  propertyInfo: {
    address: '2847 Oakwood Terrace, Millbrook, IL 60536',
    details: [
      'Historic Oak District',
      'Original Purchase: $235,000 (2012)',
      'Current Tax Assessment: $268,000',
      'Estimated Market Value: $285,000'
    ]
  },
  avatar: '/placeholder.svg?height=100&width=100',
  isPlaceholder: false
}

// You would add this data to your Firebase 'Sellers' collection
// using the Firebase Admin SDK or through the Firebase console

