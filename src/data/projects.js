// src/data/projects.js
// Single source of truth for all Brainwing locations.
// WorldMap.jsx, JourneySidebar, JourneyStepper and LocationPanel
// all read from this file — add a new city here and it appears
// everywhere automatically.

export const projects = [
  {
    id: "mumbai",
    city: "Mumbai",
    country: "India",
    region: "Maharashtra, India",
    lat: 19.076,
    lng: 72.8777,

    // Short tagline shown below city name in panel
    tagline: "Brainwing Headquarters",

    // Icon shown in sidebar thumb
    icon: "🏙",

    // Label anchor direction — prevents cluster overlap on map
    // values: "right" | "left" | "top" | "bottom"
    labelAnchor: "right",

    projectCount: 4,

    // Real project list rendered as clickable rows in the panel
    items: [
      {
        name: "Apollo Spaces, Athena",
        category: "3D Arch Viz · Drone Cinematic",
        description:
          "Photorealistic exterior & interior renders for a luxury residential tower in Matunga — day/night façades with drone superimposed video.",
        url: "https://brainwing.in/projects.php",
      },
      {
        name: "Hiranandani Vista",
        category: "Walkthrough · Scale Model",
        description:
          "Full 3D walkthrough and architectural scale model showcasing a premium North West Mumbai residential tower.",
        url: "https://brainwing.in/projects.php",
      },
      {
        name: "Paradigm Anantaara",
        category: "3D Rendering · Animation",
        description:
          "Luxury apartment renders, amenity spaces and immersive animated video to drive pre-sales for this prestigious development.",
        url: "https://brainwing.in/projects.php",
      },
      {
        name: "Squarefeet Group — Mumbai",
        category: "3D Rendering · Marketing",
        description:
          "Detailed still renders for Squarefeet Group's flagship Mumbai project — stunning clarity that brought the developer's vision to life.",
        url: "https://brainwing.in/projects.php",
      },
    ],

    services: [
      "3D Architectural Visualization",
      "Real Estate Experience",
      "3D Walkthrough",
      "Project Films",
    ],

    // Showreel / walkthrough video link (opens in new tab from play button)
    videoUrl: "https://brainwing.in/projects.php",
  },

  {
    id: "borivali",
    city: "Borivali",
    country: "India",
    region: "Maharashtra, India",
    lat: 19.2307,
    lng: 72.8567,

    tagline: "North Mumbai",
    icon: "🏗",
    labelAnchor: "left",

    projectCount: 2,

    items: [
      {
        name: "Squarefeet Group",
        category: "3D Rendering · Exterior & Interior",
        description:
          "Detailed still renders for Squarefeet Group's Borivali residential project — incredibly realistic imagery the client described as 'stunning'.",
        url: "https://brainwing.in/projects.php",
      },
      {
        name: "Sugee Group",
        category: "3D Rendering · Marketing Visuals",
        description:
          "3D rendering and marketing visuals for Sugee Group's Borivali development. The client commissioned further work based on the quality of output.",
        url: "https://brainwing.in/projects.php",
      },
    ],

    services: [
      "3D Visualization",
      "Digital Sales Experience",
      "Project Presentation",
    ],

    videoUrl: "https://brainwing.in/projects.php",
  },

  {
    id: "thane",
    city: "Thane",
    country: "India",
    region: "Maharashtra, India",
    lat: 19.1978,
    lng: 72.9798,

    tagline: "Thane District",
    icon: "🏛",
    labelAnchor: "right",

    projectCount: 2,

    items: [
      {
        name: "Residential Tower",
        category: "3D Arch Viz · Day & Night Renders",
        description:
          "Large-scale residential tower — 5-render exterior package with day & night lighting plus a 3-minute animated walkthrough video.",
        url: "https://brainwing.in/projects.php",
      },
      {
        name: "Scale Model Project",
        category: "Interactive Scale Model · App-Controlled LED",
        description:
          "Architectural scale model with app-controlled LED lighting for the sales office — highlights specific floors and features at the tap of a button.",
        url: "https://brainwing.in/architectural-scale-models-service.php",
      },
    ],

    services: [
      "3D Walkthrough",
      "Scale Model Visualization",
      "Real Estate Experience",
    ],

    videoUrl: "https://brainwing.in/projects.php",
  },

  {
    id: "colaba",
    city: "Colaba",
    country: "India",
    region: "Maharashtra, India",
    lat: 18.9067,
    lng: 72.8147,

    tagline: "South Mumbai",
    icon: "🏰",
    labelAnchor: "left",

    projectCount: 2,

    items: [
      {
        name: "Platinum Group",
        category: "Scale Model · 3D Renders · Interactive Lights",
        description:
          "Premium 3D renders and architectural scale model with interactive lighting for Platinum Group — described as 'truly unique' by the client.",
        url: "https://brainwing.in/projects.php",
      },
    ],

    services: [
      "Premium Real Estate Experience",
      "3D Visualization",
      "Project Films",
    ],

    videoUrl: "https://brainwing.in/projects.php",
  },

  {
    id: "bangalore",
    city: "Bangalore",
    country: "India",
    region: "Karnataka, India",
    lat: 12.9716,
    lng: 77.5946,

    tagline: "South India",
    icon: "🌆",
    labelAnchor: "right",

    projectCount: 2,

    items: [
      {
        name: "Mahindra Zen",
        category: "3D Rendering · Drone · Walkthrough",
        description:
          "Complete 3D visualization package for Mahindra Zen — exterior renders, interior walkthroughs and drone superimposed video.",
        url: "https://brainwing.in/projects.php",
      },
      {
        name: "Paradigm Anantaara Walkthrough",
        category: "3D Walkthrough · Animation",
        description:
          "Immersive 3D animated walkthrough through lobbies, amenities and apartment interiors — crafted to convert off-plan buyers.",
        url: "https://brainwing.in/projects.php",
      },
    ],

    services: [
      "3D Architectural Visualization",
      "Digital Sales Experience",
      "Interactive Presentation",
    ],

    videoUrl: "https://brainwing.in/projects.php",
  },

  {
    id: "london",
    city: "London",
    country: "United Kingdom",
    region: "United Kingdom",
    lat: 51.5072,
    lng: -0.1276,

    tagline: "International",
    icon: "🇬🇧",
    labelAnchor: "right",

    projectCount: 1,

    items: [
      {
        name: "Avenfield London",
        category: "International · 3D Architectural Modelling",
        description:
          "Brainwing's first European client — 3D architectural modelling and visualization for a premium UK property. Renders described as 'absolutely beautiful and perfectly aligned with our vision.'",
        url: "https://brainwing.in/projects.php",
      },
    ],

    services: [
      "International Project Experience",
      "3D Visualization",
      "Digital Presentation",
    ],

    videoUrl: "https://brainwing.in/projects.php",
  },
];