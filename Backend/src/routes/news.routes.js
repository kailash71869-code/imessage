import express from 'express';

const router = express.Router();

// Supported categories
const CATEGORIES = [
  'world',
  'technology',
  'science',
  'sports',
  'business',
  'health',
  'education',
  'entertainment',
];

// Simulated realistic news database (32+ articles across all 8 categories)
const ARTICLES = [
  // TECHNOLOGY
  {
    id: 'news-tech-1',
    title: 'Next-Generation WebAssembly Brings Desktop-Grade Compilers to Browsers',
    description: 'Engineers achieve near-native compilation speeds inside browser runtimes using new WebAssembly threads and SIMD instructions.',
    content: 'Browser vendors and runtime developers have announced significant milestones for WebAssembly (Wasm). With zero-cost exception handling, 128-bit SIMD vectorization, and multi-threaded worker pools, complex native toolchains can now execute client-side at 98% native speed. This opens up entirely new classes of offline-first web apps, client-side video transcoders, and in-browser machine learning execution.',
    category: 'technology',
    source: 'TechPulse Daily',
    author: 'Elena Rostova',
    imageUrl: 'https://picsum.photos/seed/tech1/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35m ago
    readTime: '4 min read',
  },
  {
    id: 'news-tech-2',
    title: 'Open Source Neural Models Achieve Record Inference Throughput on Edge Chips',
    description: 'New 4-bit quantization benchmarks demonstrate smooth LLM reasoning on commodity mobile hardware without server cloud offload.',
    content: 'Edge computing took a giant leap forward today as researchers unveiled compressed neural model architectures capable of sustaining 45 tokens per second on mid-tier smartphone SoCs. The development guarantees zero-latency, private AI assistants without streaming user conversations to remote clouds.',
    category: 'technology',
    source: 'Silicon Herald',
    author: 'Marcus Vance',
    imageUrl: 'https://picsum.photos/seed/tech2/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-tech-3',
    title: 'Cryptographic Hardware Modules Adopt Post-Quantum Lattice Algorithms',
    description: 'Major hardware security manufacturers deploy ML-KEM and ML-DSA standards into server enclaves to safeguard sensitive communications.',
    content: 'Hardware security modules powering financial networks and secure communication protocols have begun upgrading to standardized post-quantum lattice primitives. This defensive shift protects end-to-end encrypted messaging infrastructures against "harvest-now, decrypt-later" adversarial campaigns.',
    category: 'technology',
    source: 'CyberDefense Review',
    author: 'Devon Park',
    imageUrl: 'https://picsum.photos/seed/tech3/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    readTime: '5 min read',
  },
  {
    id: 'news-tech-4',
    title: 'Distributed Pub/Sub Protocols Scale to Ten Million Concurrent Sockets',
    description: 'Benchmark tests show horizontally scaled Redis cluster backplanes sustaining sub-5ms latency across global availability zones.',
    content: 'Software architects demonstrate massive concurrency benchmarks using optimized WebSocket brokers paired with Redis 7.2 cluster bus topologies. Message delivery jitter remained under 4 milliseconds across transatlantic hops, cementing modern pub/sub as the gold standard for global real-time collaboration.',
    category: 'technology',
    source: 'Cloud Architecture Insights',
    author: 'Ananya Sharma',
    imageUrl: 'https://picsum.photos/seed/tech4/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    readTime: '4 min read',
  },

  // WORLD
  {
    id: 'news-world-1',
    title: 'Global Renewable Energy Coalition Surpasses Historic Solar Deployment Milestone',
    description: 'International energy consortium reports record gigawatt grid installations across three continents over the past calendar quarter.',
    content: 'A landmark report released by the International Energy Consortium highlights that renewable energy sources accounted for more than 58% of new electrical capacity additions worldwide this year. Rapid industrial efficiency gains and localized micro-grid storage installations have propelled adoption beyond even the most optimistic climate models.',
    category: 'world',
    source: 'Global Dispatch',
    author: 'Henrik Lindqvist',
    imageUrl: 'https://picsum.photos/seed/world1/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-world-2',
    title: 'International Treaty Signed for Deep-Sea Marine Sanctuary Protection',
    description: 'Delegates from 68 nations ratify unprecedented maritime zones protecting vulnerable benthic coral reef systems from dredging.',
    content: 'In Geneva, representatives from over sixty nations signed the Comprehensive High Seas Sanctuary Treaty. The agreement establishes satellite-monitored marine reserves covering 3.2 million square kilometers of the southern oceans, shielding biodiverse hydrothermal ecosystems.',
    category: 'world',
    source: 'World Courier',
    author: 'Amara Diallo',
    imageUrl: 'https://picsum.photos/seed/world2/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    readTime: '4 min read',
  },
  {
    id: 'news-world-3',
    title: 'Cross-Border High-Speed Rail Corridor Opens Connecting Six European Capitals',
    description: 'Zero-emission passenger trains inaugurate transcontinental route reducing travel times by half compared to regional aviation.',
    content: 'The first zero-emission maglev and high-speed electric passenger train completed its maiden run between Vienna, Prague, Berlin, and Brussels today. Railway authorities report ticket bookings exceeding initial quarterly projections by 140%.',
    category: 'world',
    source: 'Continental Tribune',
    author: 'Claire Dubois',
    imageUrl: 'https://picsum.photos/seed/world3/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-world-4',
    title: 'Global Satellite Mesh Delivers Free Emergency Communication to Island Nations',
    description: 'Non-profit aerospace collective activates solar-powered ground terminals providing disaster preparedness links across Oceania.',
    content: 'Remote archipelagos across the South Pacific now have continuous, resilient communication channels during typhoon seasons. The humanitarian network uses direct-to-cell low-earth-orbit constellations, ensuring emergency alerts reach isolated communities.',
    category: 'world',
    source: 'Pacific Maritime News',
    author: 'Koa Tualima',
    imageUrl: 'https://picsum.photos/seed/world4/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    readTime: '4 min read',
  },

  // SCIENCE
  {
    id: 'news-sci-1',
    title: 'Deep Space Observatory Detects Atmospheric Water Vapor on Terrestrial Exoplanet',
    description: 'High-resolution transmission spectroscopy identifies stable atmospheric layers on rocky world orbiting habitable zone of Gliese system.',
    content: 'Astrophysicists analyzing spectroscopic data gathered by deep-space infrared observatories have confirmed atmospheric signatures of water vapor and nitrogen on exoplanet Gliese 12-b. The discovery represents the clearest spectroscopic view of a temperate, Earth-sized rocky world outside our solar system to date.',
    category: 'science',
    source: 'Astrophysical Journal Today',
    author: 'Dr. Lucas Zhao',
    imageUrl: 'https://picsum.photos/seed/science1/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    readTime: '5 min read',
  },
  {
    id: 'news-sci-2',
    title: 'Magnetic Confinement Fusion Reactor Sustains 100-Second High-Confinement Plasma',
    description: 'Experimental tokamak facility achieves steady-state plasma equilibrium, marking crucial progress toward commercial pilot plants.',
    content: 'Nuclear fusion scientists celebrated a key engineering benchmark as the Advanced Superconducting Tokamak sustained a 120-million-degree core temperature for over one hundred seconds without disruptive magnetic turbulence. The milestone validates superconducting magnet insulation materials.',
    category: 'science',
    source: 'Science Frontier',
    author: 'Rachel Steinberg',
    imageUrl: 'https://picsum.photos/seed/science2/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    readTime: '4 min read',
  },
  {
    id: 'news-sci-3',
    title: 'Ancient Subglacial Lakes in Antarctica Yield Undiscovered Extremophile Microbes',
    description: 'Sterile drilling expedition uncovers sealed microbial ecosystem thriving in complete darkness for over two million years.',
    content: 'Geobiologists retrieving pressurized core samples from Lake Mercer beneath the Antarctic ice sheet have isolated biological organisms that utilize chemosynthetic sulfur metabolism. The findings offer compelling analogues for potential life within the icy oceans of Jupiter’s moon Europa.',
    category: 'science',
    source: 'Antarctic Science Review',
    author: 'Prof. Graham Sterling',
    imageUrl: 'https://picsum.photos/seed/science3/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    readTime: '4 min read',
  },
  {
    id: 'news-sci-4',
    title: 'Quantum Sensor Arrays Map Subterranean Aquifers with Millimeter Precision',
    description: 'Gravimetric quantum interferometers allow environmental teams to monitor drought recharge cycles non-invasively from the surface.',
    content: 'By deploying atomic fountain quantum gravimeters on mobile survey vans, hydrogeologists can now map underground aquifers through bedrock with unprecedented accuracy. The technology offers vital data for drought resilience and sustainable agricultural planning.',
    category: 'science',
    source: 'Quantum Science Weekly',
    author: 'Mina Takahashi',
    imageUrl: 'https://picsum.photos/seed/science4/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 800).toISOString(),
    readTime: '3 min read',
  },

  // SPORTS
  {
    id: 'news-sports-1',
    title: 'Championship Final Decided by Dramatic Stoppage-Time Volley',
    description: 'Underdogs capture continental club trophy in a thrilling 3-2 contest attended by eighty thousand spectators.',
    content: 'In one of the most electrifying club finals in recent memory, underdog challengers struck twice in the final seven minutes to reverse a deficit and claim the title. Tacticians praised the team’s high-intensity pressing and fluid wing play against defensive stalwarts.',
    category: 'sports',
    source: 'Global Sports Chronicle',
    author: 'Mateo Rossi',
    imageUrl: 'https://picsum.photos/seed/sports1/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-sports-2',
    title: 'Electric Rally Championship Introduces Next-Gen 800kW Powertrains',
    description: 'High-torque electric racing machines conquer gravel and desert stages with zero tailpipe emissions and instant power delivery.',
    content: 'Motorsport governing bodies kicked off the new season with all-electric rally vehicles generating 800 kilowatts of instantaneous all-wheel torque. Spectators in the desert dunes marveled at the lightning acceleration and regenerated braking efficiency.',
    category: 'sports',
    source: 'Apex Motorsport Weekly',
    author: 'Sébastien Leclerc',
    imageUrl: 'https://picsum.photos/seed/sports2/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-sports-3',
    title: 'Marathon Legend Smashes Course Record by Two Minutes in Berlin',
    description: 'Consistent pacing, favorable tailwinds, and custom carbon-fiber racing shoes propel distance runner into history books.',
    content: 'Crossing the Brandenburg Gate with split times defying historical averages, the world champion shaved one hundred and twenty seconds off the existing world marathon mark. Sports physiologists highlighted groundbreaking hydration and fueling protocols.',
    category: 'sports',
    source: 'Athletics Monthly',
    author: 'Kiprotich Bett',
    imageUrl: 'https://picsum.photos/seed/sports3/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    readTime: '2 min read',
  },
  {
    id: 'news-sports-4',
    title: 'Grand Slam Final Delivers Five-Set Masterclass Over Five Hours',
    description: 'Young phenom triumphs over defending champion in a battle of baseline tenacity and immaculate court craft.',
    content: 'A five-hour showcase of precision tennis captivated millions around the globe. Both competitors traded tiebreak sets before a stunning cross-court forehand winner sealed championship point in the decider.',
    category: 'sports',
    source: 'Court & Racquet',
    author: 'Liam O’Connor',
    imageUrl: 'https://picsum.photos/seed/sports4/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 650).toISOString(),
    readTime: '4 min read',
  },

  // BUSINESS
  {
    id: 'news-biz-1',
    title: 'Advanced Semiconductor Fab Announces Groundbreaking for 1.8nm Facility',
    description: 'Next-generation lithography complex set to boost regional manufacturing resilience and supply chain autonomy.',
    content: 'A consortium of microelectronics leaders broke ground on a thirty-billion-dollar cleanroom facility dedicated to extreme ultraviolet 1.8nm chip fabrication. The project will generate over twelve thousand direct engineering jobs and anchor domestic technology supply chains.',
    category: 'business',
    source: 'Market Herald',
    author: 'Julianne Thorne',
    imageUrl: 'https://picsum.photos/seed/biz1/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    readTime: '4 min read',
  },
  {
    id: 'news-biz-2',
    title: 'Venture Capital Shifting Toward Capital-Efficient Infrastructure & DevTools',
    description: 'Quarterly funding trends reveal surge in investments targeting developer productivity, developer tooling, and database optimization.',
    content: 'Investors are increasingly steering capital into developer platforms and developer workflow tools. Startups focusing on offline-first sync, WebAssembly runtimes, and distributed caching secured record seed and Series A rounds this quarter.',
    category: 'business',
    source: 'Venture Compass',
    author: 'Evelyn Reed',
    imageUrl: 'https://picsum.photos/seed/biz2/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-biz-3',
    title: 'Global Supply Chains Turn to Automated Predictive Shipping Optimization',
    description: 'Logistics carriers employ machine learning models to eliminate port congestion and optimize maritime container routes.',
    content: 'Major shipping lines operating across the Pacific report a 22% reduction in fuel consumption and port idling after adopting real-time route optimization software. The transition saves billions in operational costs while trimming maritime carbon output.',
    category: 'business',
    source: 'Trade & Logistics International',
    author: 'Hans Richter',
    imageUrl: 'https://picsum.photos/seed/biz3/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-biz-4',
    title: 'Green Bond Market Hits Trillion-Dollar Milestone Ahead of Forecasts',
    description: 'Municipalities and corporations issue certified environmental bonds to finance solar grids and wetland restoration.',
    content: 'Institutional appetite for certified ESG debt instruments reached unprecedented highs, with total global green bond issuance topping the one-trillion-dollar mark. Financial auditors point to rigorous transparency standards as the catalyst for investor trust.',
    category: 'business',
    source: 'Sustainable Finance Today',
    author: 'Tariq Al-Mansoor',
    imageUrl: 'https://picsum.photos/seed/biz4/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 920).toISOString(),
    readTime: '4 min read',
  },

  // HEALTH
  {
    id: 'news-health-1',
    title: 'Personalized mRNA Therapeutics Demonstrate Clinical Remission in Trials',
    description: 'Custom therapeutic vaccines synthesized from patient tumor biopsies demonstrate exceptional safety and response profiles.',
    content: 'Oncology teams reported phase II clinical trial results showing 84% recurrence-free survival among high-risk patients receiving tailored mRNA immunotherapy. The rapid turnaround of computer-aided mRNA synthesis enables personalized formulations in under four weeks.',
    category: 'health',
    source: 'Medical Vanguard',
    author: 'Dr. Sarah Lin',
    imageUrl: 'https://picsum.photos/seed/health1/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    readTime: '4 min read',
  },
  {
    id: 'news-health-2',
    title: 'Longitudinal Study Confirms Neurological Benefits of Consistent Sleep Schedules',
    description: 'Tracking ten thousand participants reveals that sleep regularity index strongly correlates with cognitive longevity.',
    content: 'A comprehensive fifteen-year cohort study published today underscores that keeping a consistent sleep and wake schedule is even more protective against neurodegeneration than total hours slept. Regular circadian cycles optimize glymphatic waste clearance in the brain.',
    category: 'health',
    source: 'Neuroscience Gazette',
    author: 'Dr. Anthony Ward',
    imageUrl: 'https://picsum.photos/seed/health2/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-health-3',
    title: 'Non-Invasive Wearable Monitors Continuous Metabolic Biomarkers',
    description: 'Micro-needle patches measure interstitial glucose, lactate, and electrolytes without painful finger-pricks.',
    content: 'Bioengineers have completed human trials on a flexible bio-wearable that monitors interstitial fluid continuously. Athletes and diabetes patients benefit from immediate dietary insights with zero discomfort and continuous smartphone Bluetooth telemetry.',
    category: 'health',
    source: 'BioTech Innovations',
    author: 'Priya Nambiar',
    imageUrl: 'https://picsum.photos/seed/health3/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-health-4',
    title: 'AI Diagnostic Radiology Model Detects Early-Stage Pulmonary Anomalies',
    description: 'Multi-institutional study validates clinical diagnostic accuracy superior to conventional screen reviews.',
    content: 'Hospitals adopting assistive AI image analysis in emergency radiology departments report a 35% reduction in missed subtle fractures and early pulmonary nodules. Radiologists emphasize the tool acts as an indispensable second pair of eyes.',
    category: 'health',
    source: 'Clinical Diagnostic Journal',
    author: 'Dr. Robert Gallagher',
    imageUrl: 'https://picsum.photos/seed/health4/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 750).toISOString(),
    readTime: '4 min read',
  },

  // EDUCATION
  {
    id: 'news-edu-1',
    title: 'Universities Integrate Spatial Computing Labs for Chemistry & Molecular Biology',
    description: 'Students manipulate virtual protein foldings and atomic bonds in interactive collaborative 3D environments.',
    content: 'Leading research universities have replaced flat 2D molecular textbooks with interactive spatial visualization labs. Chemistry students collaborating in simulated classrooms can assemble peptide chains and observe energetic binding states in real time.',
    category: 'education',
    source: 'Higher Ed Horizon',
    author: 'Prof. Nathan Brooks',
    imageUrl: 'https://picsum.photos/seed/edu1/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-edu-2',
    title: 'Open Educational Resource Initiative Provides Free STEM Curricula in 20 Languages',
    description: 'Global foundation releases peer-reviewed interactive mathematics and computer science courses for secondary schools.',
    content: 'A non-profit educational coalition has launched a completely open-source K-12 STEM curriculum available in twenty languages. The platform includes offline-accessible interactive labs, grading rubrics, and video lessons optimized for low-bandwidth devices.',
    category: 'education',
    source: 'Global Educator',
    author: 'Fatima Al-Zahra',
    imageUrl: 'https://picsum.photos/seed/edu2/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-edu-3',
    title: 'Robotics Apprenticeship Programs Bridge Technical Skills Gap for Modern Manufacturing',
    description: 'Cooperative work-study programs pair high school graduates with automated manufacturing facilities.',
    content: 'Vocational high schools partnering with industrial automation firms have expanded apprenticeships. Students earn a full salary while gaining certified credentials in programmable logic controllers (PLCs), robotic kinematics, and maintenance.',
    category: 'education',
    source: 'Vocational Education Today',
    author: 'Martin Kowalski',
    imageUrl: 'https://picsum.photos/seed/edu3/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 580).toISOString(),
    readTime: '4 min read',
  },
  {
    id: 'news-edu-4',
    title: 'Cognitive Science Research Recommends Spaced Repetition in Primary Curricula',
    description: 'Empirical data shows long-term retention of foreign languages and arithmetic doubles with scheduled recall intervals.',
    content: 'New educational neuroscience findings reveal dramatic boosts in recall when schools structure review intervals using automated spaced repetition systems. Several national school boards are revising daily schedules to incorporate short retrieval sessions.',
    category: 'education',
    source: 'Learning & Memory Science',
    author: 'Dr. Caroline Evans',
    imageUrl: 'https://picsum.photos/seed/edu4/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 950).toISOString(),
    readTime: '4 min read',
  },

  // ENTERTAINMENT
  {
    id: 'news-ent-1',
    title: 'Independent Sci-Fi Feature Sweeps Global Film Festival Awards',
    description: 'Low-budget auteur production shot entirely with practical in-camera optical effects captivates critics and audiences alike.',
    content: 'Premiering at the international film festival, the indie sensation captured five top honors including Best Director and Best Cinematography. The filmmaker utilized analog miniatures and bespoke lens prisms to create an astonishing vision of interstellar travel.',
    category: 'entertainment',
    source: 'Cinema Scope Weekly',
    author: 'Chloe Beaumont',
    imageUrl: 'https://picsum.photos/seed/ent1/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-ent-2',
    title: 'Immersive Spatial Audio Concerts Redefine Virtual Live Music Experiences',
    description: 'Binaural sound field simulation brings festival headliners directly to headphones with uncanny room acoustic realism.',
    content: 'Music streaming innovators held an experimental virtual festival broadcast with high-order ambisonic sound. Listeners around the world reported feeling as if they were physically standing in the center of the auditorium alongside thousands of fellow fans.',
    category: 'entertainment',
    source: 'Sound & Stage Review',
    author: 'Dante Moretti',
    imageUrl: 'https://picsum.photos/seed/ent2/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
    readTime: '3 min read',
  },
  {
    id: 'news-ent-3',
    title: 'Digital Museum Archive Preserves Lost Architectural Wonders in 8K Volumetric Scans',
    description: 'Heritage preservationists create interactive virtual walkthroughs of historical monuments threatened by erosion.',
    content: 'Using drone photogrammetry and lidar scanners, an international heritage foundation has cataloged over two hundred ancient archaeological sites. Anyone with a browser or VR headset can explore every courtyard and fresco with millimeter fidelity.',
    category: 'entertainment',
    source: 'Cultural Arts Monthly',
    author: 'Zainab Qasim',
    imageUrl: 'https://picsum.photos/seed/ent3/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 380).toISOString(),
    readTime: '4 min read',
  },
  {
    id: 'news-ent-4',
    title: 'Procedural Worldbuilding Engine Sets New Standard for Open-World RPG Gaming',
    description: 'Game studio releases revolutionary physics and dynamic weather engine running at 120 FPS on next-gen hardware.',
    content: 'Gamers and technical reviewers have heaped praise on the latest release from veteran studios. The title features a living ecosystem where river courses erode terrain in real time and NPCs remember players’ choices across distinct campaigns.',
    category: 'entertainment',
    source: 'Polygon Spectrum',
    author: 'Felix Baum',
    imageUrl: 'https://picsum.photos/seed/ent4/800/450',
    publishedAt: new Date(Date.now() - 1000 * 60 * 680).toISOString(),
    readTime: '3 min read',
  },
];

/**
 * GET /api/news
 * Return news feed (all categories, or filtered by query params `category`, `q`, `limit`, `page`)
 */
router.get('/', (req, res) => {
  try {
    const { category, q, limit = 20, page = 1 } = req.query;

    let filtered = [...ARTICLES];

    // Filter by category if requested
    if (category && category !== 'all') {
      const lowerCat = category.toLowerCase().trim();
      filtered = filtered.filter((a) => a.category.toLowerCase() === lowerCat);
    }

    // Filter by search query if provided
    if (q && q.trim()) {
      const query = q.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query) ||
          a.source.toLowerCase().includes(query)
      );
    }

    // Sort by publication time (most recent first)
    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      total: filtered.length,
      page: pageNum,
      limit: limitNum,
      categories: ['all', ...CATEGORIES],
      articles: paginated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/news/category/:category
 * Filter news by category
 */
router.get('/category/:category', (req, res) => {
  try {
    const categoryParam = req.params.category.toLowerCase().trim();

    if (categoryParam !== 'all' && !CATEGORIES.includes(categoryParam)) {
      return res.status(404).json({
        success: false,
        error: `Category '${categoryParam}' not found. Supported categories: ${CATEGORIES.join(', ')}`,
      });
    }

    let filtered = ARTICLES;
    if (categoryParam !== 'all') {
      filtered = ARTICLES.filter((a) => a.category.toLowerCase() === categoryParam);
    }

    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    res.json({
      success: true,
      category: categoryParam,
      count: filtered.length,
      articles: filtered,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/news/search
 * Search news articles by title, description, or content
 */
router.get('/search', (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase().trim();

    if (!query) {
      return res.json({
        success: true,
        query: '',
        count: ARTICLES.length,
        articles: ARTICLES,
      });
    }

    const matched = ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query) ||
        a.source.toLowerCase().includes(query) ||
        a.author.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query)
    );

    matched.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    res.json({
      success: true,
      query,
      count: matched.length,
      articles: matched,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
