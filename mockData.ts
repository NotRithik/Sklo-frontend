import { Conversation, Fact, Constraint, HistoricalExample } from './types';

export const MOCK_FACTS: Fact[] = [
  { id: 'f1', statement: "The 'Hazy Dawn' IPA uses Citra and Mosaic hops.", source: "Product Spec Sheet", confidence: 0.99, category: "Product", lastUpdated: "2024-05-10" },
  { id: 'f2', statement: "Standard shipping takes 3-5 business days within the continental US.", source: "Logistics Policy", confidence: 0.95, category: "Logistics", lastUpdated: "2024-06-12" },
  { id: 'f3', statement: "We cannot ship alcohol to P.O. boxes.", source: "Legal Compliance", confidence: 1.0, category: "Legal", lastUpdated: "2023-11-01" },
  { id: 'f4', statement: "The taproom is open until 11 PM on weekends.", source: "Website / Hours", confidence: 0.85, category: "General", lastUpdated: "2024-02-20" },
  { id: 'f5', statement: "Gluten-reduced options are available but not certified gluten-free.", source: "QA Report", confidence: 0.92, category: "Product", lastUpdated: "2024-05-15" },
];

export const MOCK_CONSTRAINTS: Constraint[] = [
  { id: 'c1', name: "Pregnancy/Health Claims", description: "Do not provide medical advice regarding alcohol consumption during pregnancy. Refer to official health guidelines.", isActive: true, severity: 'Critical', type: 'Safety' },
  { id: 'c2', name: "Competitor Disparagement", description: "Do not speak negatively about other local breweries.", isActive: true, severity: 'Medium', type: 'Brand' },
  { id: 'c3', name: "Age Verification Logic", description: "Ensure user is 21+ before discussing purchasing options.", isActive: true, severity: 'High', type: 'Legal' },
  { id: 'c4', name: "Dry County Shipping", description: "Check zip code against dry county database before confirming shipping availability.", isActive: true, severity: 'High', type: 'Accuracy' },
];

export const MOCK_HISTORY: HistoricalExample[] = [
  { id: 'h1', scenario: "Customer asked for shipping to Japan (Osaka).", response: "We utilized DHL Freight for a pallet shipment. Required a 3-week lead time and customs broker.", tags: ["International", "Logistics"], date: "2023-08-15" },
  { id: 'h2', scenario: "Wedding party of 200 people requested a keg discount.", response: "Offered 15% discount for orders over 5 kegs, provided hand-pump rentals for free.", tags: ["Events", "Pricing"], date: "2023-12-10" },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    clientName: 'Visitor_492b',
    startTime: '10:42 AM',
    status: 'Active',
    messages: [
      { id: 'm1', role: 'user', content: "What hops are in the IPA? And is it gluten-free?", timestamp: "10:42 AM" },
      { id: 'm2', role: 'assistant', content: "Our 'Hazy Dawn' IPA features a blend of Citra and Mosaic hops for a tropical finish. Regarding gluten: we use an enzyme to reduce gluten, but it is not certified gluten-free.", timestamp: "10:42 AM", factsCited: ['f1', 'f5'] },
      { id: 'm3', role: 'user', content: "Can I get a case shipped to my PO Box in Utah?", timestamp: "10:43 AM" },
      { id: 'm4', role: 'assistant', content: "I apologize, but we cannot ship alcohol to P.O. boxes due to federal regulations. We require a physical address and an adult signature upon delivery.", timestamp: "10:43 AM", factsCited: ['f3'] },
    ]
  },
  {
    id: 'conv_2',
    clientName: 'Visitor_991a',
    startTime: '09:15 AM',
    status: 'Flagged',
    messages: [
      { id: 'm1', role: 'user', content: "My wife is pregnant but craving a stout. Is the oatmeal stout safe for her?", timestamp: "09:15 AM" },
      { id: 'm2', role: 'assistant', content: "While oatmeal stouts are delicious, I cannot provide health advice regarding alcohol consumption during pregnancy. Please consult with a healthcare professional.", timestamp: "09:15 AM", factsCited: [], violatedConstraintId: 'c1' },
    ]
  }
];