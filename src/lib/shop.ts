// Single source of truth for shop content shown on the public site.
// Anything marked `sample: true` is placeholder copy and must be replaced
// with real data before launch.

export type Location = {
  slug: string;
  name: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string | null;
  hours: string | null;
  photo: string | null;
};

export type Barber = {
  name: string;
  location: string; // Location slug
  specialty: string;
  sample?: boolean;
};

export type Review = {
  author: string;
  body: string;
  rating: 1 | 2 | 3 | 4 | 5;
  location: string; // Location slug
  sample?: boolean;
};

export const brand = {
  name: "Gold'n Era Barbershop",
  wordmark: "Gold'n Era",
  tagline: "Classic cuts. Clean fades. Two shops in Moreno Valley.",
  city: "Moreno Valley, CA",
};

export const locations: Location[] = [
  {
    slug: "pigeon-pass",
    name: "Pigeon Pass",
    street: "12220 Pigeon Pass Rd B",
    city: "Moreno Valley",
    region: "CA",
    postalCode: "92557",
    phone: null,
    hours: null,
    photo: "/shop-pigeon-pass.jpg",
  },
  {
    slug: "moreno-beach",
    name: "Moreno Beach",
    street: "14435 Moreno Beach Dr #105",
    city: "Moreno Valley",
    region: "CA",
    postalCode: "92555",
    phone: null,
    hours: null,
    photo: null,
  },
];

export const barbers: Barber[] = [
  { name: "Barber One", location: "pigeon-pass", specialty: "Skin fades", sample: true },
  { name: "Barber Two", location: "pigeon-pass", specialty: "Beard sculpting", sample: true },
  { name: "Barber Three", location: "pigeon-pass", specialty: "Tapers & designs", sample: true },
  { name: "Barber Four", location: "moreno-beach", specialty: "Classic scissor cuts", sample: true },
  { name: "Barber Five", location: "moreno-beach", specialty: "Kids' cuts", sample: true },
  { name: "Barber Six", location: "moreno-beach", specialty: "Hot towel shaves", sample: true },
];

export const reviews: Review[] = [
  {
    author: "Sample review",
    body: "Placeholder text. Replace with a real Google or Yelp review the owner approves.",
    rating: 5,
    location: "pigeon-pass",
    sample: true,
  },
  {
    author: "Sample review",
    body: "Placeholder text. Replace with a real Google or Yelp review the owner approves.",
    rating: 5,
    location: "moreno-beach",
    sample: true,
  },
  {
    author: "Sample review",
    body: "Placeholder text. Replace with a real Google or Yelp review the owner approves.",
    rating: 5,
    location: "pigeon-pass",
    sample: true,
  },
];

export function fullAddress(l: Location) {
  return `${l.street}, ${l.city}, ${l.region} ${l.postalCode}`;
}

export function mapsUrl(l: Location) {
  const q = encodeURIComponent(`${brand.name}, ${fullAddress(l)}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function locationName(slug: string) {
  return locations.find((l) => l.slug === slug)?.name ?? slug;
}
