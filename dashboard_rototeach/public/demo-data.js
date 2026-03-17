// ============================================================
// DEMO DATA — Rototech Engineering Systems
// ============================================================

window.DEMO_DATA = {
  kpis: {
    totalRevenue:   11580000,   // sum of all 15 recentTransactions amounts
    totalOrders:    15,         // exact row count of recentTransactions
    avgOrderValue:  772000,     // Math.round(11580000 / 15)
    topPlant:     'MVR System',
    topIndustry:    'Pharmaceutical',
    topCustomer:    'Jubilant Industries',  // 980K + 1250K = 2,230,000 (highest)
    topSalesperson: 'Rajesh Patel',
    topRegion:      'Gujarat'
  },
  revenueByMonth: [
    {month:'Jan 2024',revenue:820000},{month:'Feb 2024',revenue:1050000},
    {month:'Mar 2024',revenue:1430000},{month:'Apr 2024',revenue:980000},
    {month:'May 2024',revenue:1240000},{month:'Jun 2024',revenue:870000},
    {month:'Jul 2024',revenue:1560000},{month:'Aug 2024',revenue:1380000},
    {month:'Sep 2024',revenue:1120000},{month:'Oct 2024',revenue:1680000},
    {month:'Nov 2024',revenue:1950000},{month:'Dec 2024',revenue:1320000},
    {month:'Jan 2025',revenue:940000},{month:'Feb 2025',revenue:1110000},
    {month:'Mar 2025',revenue:1540000},{month:'Apr 2025',revenue:730000}
  ],
  revenueByPlant: [
    {plant:'MVR System',revenue:4320000,orders:14},
    {plant:'MEE Plant',revenue:3850000,orders:12},
    {plant:'ATFD Dryer',revenue:2760000,orders:11},
    {plant:'ETP System',revenue:2340000,orders:13},
    {plant:'Stripper Column',revenue:1890000,orders:9},
    {plant:'Flash Dryer',revenue:1240000,orders:8},
    {plant:'Spray Dryer',revenue:870000,orders:6},
    {plant:'Caustic Recovery',revenue:450000,orders:3}
  ],
  revenueBySalesperson: [
    {name:'Rajesh Patel',revenue:5840000,orders:22},
    {name:'Priya Shah',revenue:4210000,orders:17},
    {name:'Vikram Mehta',revenue:3650000,orders:15},
    {name:'Anil Desai',revenue:2470000,orders:13},
    {name:'Sunita Joshi',revenue:1550000,orders:9}
  ],
  revenueByRegion: [
    {region:'Gujarat',revenue:6230000,pct:35.2},
    {region:'Maharashtra',revenue:3890000,pct:22.0},
    {region:'Rajasthan',revenue:2540000,pct:14.3},
    {region:'Tamil Nadu',revenue:2110000,pct:11.9},
    {region:'Punjab',revenue:1740000,pct:9.8},
    {region:'Andhra Pradesh',revenue:1210000,pct:6.8}
  ],
  revenueByIndustry: [
    {industry:'Distillery',revenue:5640000,pct:31.8},
    {industry:'Pharmaceutical',revenue:4230000,pct:23.9},
    {industry:'Textile',revenue:3180000,pct:17.9},
    {industry:'Chemical',revenue:2670000,pct:15.1},
    {industry:'Food & Beverage',revenue:1320000,pct:7.5},
    {industry:'Other',revenue:680000,pct:3.8}
  ],
  revenueByCustomer: [
    {customer:'Jubilant Industries',revenue:3240000,orders:8},
    {customer:'Alembic Pharma',revenue:2870000,orders:7},
    {customer:'Vardhman Textiles',revenue:2210000,orders:6},
    {customer:'DCM Shriram',revenue:1980000,orders:7},
    {customer:'Vadilal Industries',revenue:1750000,orders:5},
    {customer:'Venus Remedies',revenue:1540000,orders:6},
    {customer:'Nahar Group',revenue:1230000,orders:5},
    {customer:'Balrampur Chini',revenue:2900000,orders:32}
  ],
  customerPlantMatrix: [
    {customer:'Jubilant Industries',plant:'MVR System',amount:1250000,count:3},
    {customer:'Jubilant Industries',plant:'MEE Plant',amount:980000,count:2},
    {customer:'Alembic Pharma',plant:'ATFD Dryer',amount:1430000,count:4},
    {customer:'Alembic Pharma',plant:'ETP System',amount:870000,count:2},
    {customer:'Vardhman Textiles',plant:'MEE Plant',amount:1100000,count:3},
    {customer:'DCM Shriram',plant:'Stripper Column',amount:780000,count:2},
    {customer:'DCM Shriram',plant:'MVR System',amount:960000,count:2},
    {customer:'Vadilal Industries',plant:'Flash Dryer',amount:540000,count:2},
    {customer:'Venus Remedies',plant:'ATFD Dryer',amount:720000,count:2},
    {customer:'Nahar Group',plant:'Caustic Recovery',amount:450000,count:1},
    {customer:'Balrampur Chini',plant:'MVR System',amount:1150000,count:3},
    {customer:'Balrampur Chini',plant:'ETP System',amount:690000,count:2}
  ],
  recentTransactions: [
    {date:'12 Apr 2025',customer:'Alembic Pharma',plant:'ATFD Dryer',industry:'Pharmaceutical',salesperson:'Priya Shah',region:'Gujarat',amount:580000},
    {date:'08 Apr 2025',customer:'DCM Shriram',plant:'MVR System',industry:'Chemical',salesperson:'Rajesh Patel',region:'Rajasthan',amount:1200000},
    {date:'01 Apr 2025',customer:'Jubilant Industries',plant:'MEE Plant',industry:'Distillery',salesperson:'Vikram Mehta',region:'Maharashtra',amount:980000},
    {date:'24 Mar 2025',customer:'Vardhman Textiles',plant:'ETP System',industry:'Textile',salesperson:'Anil Desai',region:'Punjab',amount:750000},
    {date:'18 Mar 2025',customer:'Venus Remedies',plant:'ATFD Dryer',industry:'Pharmaceutical',salesperson:'Priya Shah',region:'Gujarat',amount:720000},
    {date:'10 Mar 2025',customer:'Balrampur Chini',plant:'Stripper Column',industry:'Food & Beverage',salesperson:'Rajesh Patel',region:'Andhra Pradesh',amount:610000},
    {date:'28 Feb 2025',customer:'Nahar Group',plant:'Flash Dryer',industry:'Chemical',salesperson:'Sunita Joshi',region:'Tamil Nadu',amount:420000},
    {date:'20 Feb 2025',customer:'Alembic Pharma',plant:'ETP System',industry:'Pharmaceutical',salesperson:'Priya Shah',region:'Gujarat',amount:870000},
    {date:'14 Feb 2025',customer:'Jubilant Industries',plant:'MVR System',industry:'Distillery',salesperson:'Vikram Mehta',region:'Gujarat',amount:1250000},
    {date:'05 Feb 2025',customer:'Vadilal Industries',plant:'Flash Dryer',industry:'Food & Beverage',salesperson:'Sunita Joshi',region:'Gujarat',amount:540000},
    {date:'27 Jan 2025',customer:'DCM Shriram',plant:'Stripper Column',industry:'Chemical',salesperson:'Anil Desai',region:'Rajasthan',amount:780000},
    {date:'18 Jan 2025',customer:'Vardhman Textiles',plant:'MEE Plant',industry:'Textile',salesperson:'Rajesh Patel',region:'Maharashtra',amount:1100000},
    {date:'09 Jan 2025',customer:'Venus Remedies',plant:'Spray Dryer',industry:'Pharmaceutical',salesperson:'Priya Shah',region:'Gujarat',amount:380000},
    {date:'02 Jan 2025',customer:'Nahar Group',plant:'Caustic Recovery',industry:'Chemical',salesperson:'Sunita Joshi',region:'Tamil Nadu',amount:450000},
    {date:'22 Dec 2024',customer:'Balrampur Chini',plant:'MVR System',industry:'Distillery',salesperson:'Rajesh Patel',region:'Andhra Pradesh',amount:950000}
  ],
  pipeline: [
    {customer:'Modi Distillers',plant:'MVR System',stage:'Lead',value:2400000,region:'Gujarat',salesperson:'Rajesh Patel'},
    {customer:'Sun Pharma',plant:'ATFD Dryer',stage:'Quote',value:1800000,region:'Maharashtra',salesperson:'Priya Shah'},
    {customer:'Raymond Ltd',plant:'MEE Plant',stage:'Negotiation',value:3200000,region:'Maharashtra',salesperson:'Vikram Mehta'},
    {customer:'GSFC',plant:'ETP System',stage:'Won',value:1500000,region:'Gujarat',salesperson:'Anil Desai'},
    {customer:'ITC Ltd',plant:'Stripper Column',stage:'Lost',value:2100000,region:'Tamil Nadu',salesperson:'Sunita Joshi'},
    {customer:'Radico Khaitan',plant:'MVR System',stage:'Quote',value:2800000,region:'Rajasthan',salesperson:'Rajesh Patel'},
    {customer:'Cipla Ltd',plant:'Flash Dryer',stage:'Negotiation',value:1200000,region:'Maharashtra',salesperson:'Priya Shah'},
    {customer:'Arvind Mills',plant:'MEE Plant',stage:'Lead',value:2700000,region:'Gujarat',salesperson:'Vikram Mehta'},
    {customer:'Tata Chemicals',plant:'Caustic Recovery',stage:'Won',value:1800000,region:'Maharashtra',salesperson:'Anil Desai'},
    {customer:'Uttam Sugar',plant:'MVR System',stage:'Lead',value:3000000,region:'Punjab',salesperson:'Rajesh Patel'},
    {customer:'Natco Pharma',plant:'ATFD Dryer',stage:'Quote',value:1600000,region:'Andhra Pradesh',salesperson:'Priya Shah'},
    {customer:'Bharat Textile',plant:'ETP System',stage:'Negotiation',value:950000,region:'Tamil Nadu',salesperson:'Sunita Joshi'}
  ],
  insights: {
    summary: 'Rototech Engineering Systems has delivered strong revenue of ₹1.77 Cr across 76 orders in the Jan 2024–Apr 2025 period, with the Distillery and Pharmaceutical sectors driving over 55% of total business. Gujarat remains the dominant region contributing 35.2% of revenue, and Rajesh Patel is the top-performing salesperson with ₹58.4 L in sales.',
    bullets: [
      'MVR System and MEE Plant together account for ₹81.7 L (46% of total revenue) — these are the core growth engines.',
      'Q3 and Q4 2024 saw the highest monthly revenues (Oct: ₹16.8 L, Nov: ₹19.5 L), indicating strong year-end deal closures.',
      'Jubilant Industries and Alembic Pharma are the two most valuable customers — nurturing these relationships is critical.',
      'The pipeline has ₹31.2 L in active deals (Lead + Quote + Negotiation stages) — closing Negotiation deals should be the immediate priority.'
    ]
  },
  yoy: {
    currentYear: 2025,
    prevYear: 2024,
    currentRevenue: 4320000,
    prevRevenue: 13400000,
    currentOrders: 16,
    prevOrders: 60,
    currentAvg: 270000,
    prevAvg: 223333,
    byMonth: [
      {month:'Jan',current:940000,prev:820000},
      {month:'Feb',current:1110000,prev:1050000},
      {month:'Mar',current:1540000,prev:1430000},
      {month:'Apr',current:730000,prev:980000}
    ],
    byPlant: [
      {plant:'MVR System',current:920000,prev:3400000},
      {plant:'MEE Plant',current:780000,prev:3070000},
      {plant:'ATFD Dryer',current:960000,prev:1800000},
      {plant:'ETP System',current:870000,prev:1470000},
      {plant:'Stripper Column',current:610000,prev:1280000},
      {plant:'Flash Dryer',current:420000,prev:820000}
    ]
  }
};
