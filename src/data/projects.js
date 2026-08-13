export const projects = [
  {
    id: "mumbai",
    city: "Mumbai",
    country: "India",
    lat: 19.076,
    lng: 72.8777,
    type: "region",

    name: "Mumbai Projects",

    projects: [
      {
        id: "borivali-01",
        city: "Borivali",
        lat: 19.2307,
        lng: 72.8567,

        name: "Borivali Project",
        category: "Web Experience",

        description:
          "An interactive digital experience created by Brainwing Innovation.",

        technologies: ["React", "Three.js", "GSAP"],

        buildingModel: "/models/borivali-building.glb",

        projectUrl: "https://example.com",
      },

      {
        id: "thane-01",
        city: "Thane",
        lat: 19.2183,
        lng: 72.9781,

        name: "Thane Project",
        category: "Digital Experience",

        description:
          "A premium digital experience developed for a Thane-based project.",

        technologies: ["React", "Three.js"],

        buildingModel: "/models/thane-building.glb",

        projectUrl: "https://example.com",
      },

      {
        id: "colaba-01",
        city: "Colaba",
        lat: 18.9067,
        lng: 72.8147,

        name: "Colaba Project",
        category: "Interactive Website",

        description:
          "An immersive interactive project developed in Colaba.",

        technologies: ["React", "Three.js", "GSAP"],

        buildingModel: "/models/colaba-building.glb",

        projectUrl: "https://example.com",
      },
    ],
  },

  {
    id: "london",
    city: "London",
    country: "United Kingdom",

    lat: 51.5074,
    lng: -0.1278,

    type: "project",

    name: "London Project",
    category: "International Experience",

    description:
      "An international digital experience created by Brainwing Innovation.",

    technologies: ["React", "Three.js", "GSAP"],

    buildingModel: "/models/london-building.glb",

    projectUrl: "https://example.com",
  },
];