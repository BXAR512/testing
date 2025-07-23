export const eventsData = [
  {
    id: 1,
    title: "Summer Music Festival",
    description:
      "Join us for a fun-filled evening of music, food, and drinks at our annual Summer Music Festival.",
    date: "2023-07-15",
    time: "18:00",
    location: "City Park, New York",
    image: "https://example.com/event-image.jpg",
    category: "Music",
    capacity: 500,
    num_attending: 250,
  },
  {
    id: 2,
    title: "Art Exhibition",
    description:
      "Explore the latest works from local artists at our Art Exhibition.",
    date: "2023-08-01",
    time: "10:00",
    location: "Art Gallery, Los Angeles",
    image: "https://example.com/art-exhibition.jpg",
    category: "Art",
    capacity: 100,
    num_attending: 90,
  },
  {
    id: 3,
    title: "Book Launch",
    description:
      "Meet the author and get your copy signed at the Book Launch event.",
    date: "2023-11-10",
    time: "18:00",
    location: "City Library, Boston",
    image: "https://example.com/book-launch.jpg",
    category: "Literature",
    capacity: 50,
    num_attending: 12,
  },
  {
    id: 4,
    title: "Food Fair",
    description:
      "Taste a variety of cuisines from around the world at the Food Fair.",
    date: "2023-10-05",
    time: "12:00",
    location: "Downtown Market, Chicago",
    image: "https://example.com/food-fair.jpg",
    category: "Food",
    capacity: 300,
    num_attending: 250,
  },
  {
    id: 5,
    title: "Music Festival",
    description:
      "Experience live performances from top artists at the Music Festival.",
    date: "2023-07-20",
    time: "15:00",
    location: "Central Park, New York",
    image: "https://example.com/music-festival.jpg",
    category: "Music",
    capacity: 400,
    num_attending: 25,
  },
  {
    id: 6,
    title: "Tech Conference",
    description:
      "Join industry leaders and tech enthusiasts at the annual Tech Conference.",
    date: "2023-09-15",
    time: "09:00",
    location: "Convention Center, San Francisco",
    image: "https://example.com/tech-conference.jpg",
    category: "Technology",
    capacity: 150,
    num_attending: 10,
  },
  {
    id: 7,
    title: "Film Screening",
    description:
      "Enjoy a special screening of an award-winning film followed by a Q&A session with the director.",
    date: "2023-12-02",
    time: "19:30",
    location: "Cinema Hall, Seattle",
    image: "https://example.com/film-screening.jpg",
    category: "Film",
    capacity: 500,
    num_attending: 480,
  },
];

export const fetchEvents = () => {
  return eventsData.slice(0, 6);
};

export const fetchMoreEvents = (currentCount) => {
  const nextEvents = eventsData.slice(currentCount, currentCount + 6);
  return nextEvents;
};
