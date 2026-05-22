const events = [
  {
    id: 1,
    title: "Lollapalooza 2026",
    category: "Música",
    location: "San Isidro",
    date: "22 de marzo",
    interested: 355,
    description: "Festival de música con artistas nacionales e internacionales.",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800",
    users: [
      { id: 1, name: "Camila", age: 23, interests: ["Música", "Festivales"] },
      { id: 2, name: "Sofía", age: 21, interests: ["Pop", "Recitales"] }
    ]
  },
  {
    id: 2,
    title: "FUTTURA",
    category: "Salidas",
    location: "CABA",
    date: "15 de abril",
    interested: 120,
    description: "Evento social con música, arte y experiencias.",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800",
    users: [
      { id: 3, name: "Mateo", age: 24, interests: ["Arte", "Networking"] },
      { id: 4, name: "Julieta", age: 22, interests: ["Salidas", "Música"] }
    ]
  }
];

module.exports = events;