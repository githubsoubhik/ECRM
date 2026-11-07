// src/app/data/tasksProjectsData.ts

export interface ProjectDetails {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  taskId: string;
  status: 'Complete' | 'Ongoing' | 'Forward for Reference';
  taskDescription: string;
  assignedBy: {
    name: string;
    role: string;
    team: string;
    avatar: string;
  };
  coWorkers: Array<{
    name: string;
    avatar: string;
  }>; 
  projectDetails: {
    name: string;
    client: string;
    projectCode: string;
    icon: string;
  };
  assignedDate: string;
  dueDate: string;
  dueTime: string;
  estimatedHours: number;
  spentHours: number;
  remainingHours: number;
  progressPercentage: number;
  requirements: string[];
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  additionalNotes: string;
  attachments: Array<{
    id: string;
    name: string;
    size: string;
    date: string;
    type: 'pdf' | 'image' | 'document';
    icon: string;
  }>;
  activities: Array<{
    id: string;
    author: {
      name: string;
      avatar: string;
    };
    date: string;
    time: string;
    message: string;
  }>;
}

export const tasksProjectsData: { [key: string]: ProjectDetails } = {
  'pmu-1001': {
    id: 'pmu-1001',
    title: 'Website Homepage Design',
    priority: 'High',
    taskId: '#TAsk-1023',
    status: 'Ongoing',
    taskDescription: 'Design a modern and responsive homepage for PureAyus website with a focus on brand identity, product showcase and conversion.',
    assignedBy: {
      name: 'Rohan Sharma',
      role: 'Team Leader',
      team: 'UAUX Design Team',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan',
    },
    coWorkers: [
      { name: 'Sarah Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
      { name: 'Mike Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
      { name: 'Emily Davis', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' }
    ],
    projectDetails: {
      name: 'PureAyus E-commerce Website',
      client: 'PureAyus',
      projectCode: '#PMJ-1001',
      icon: '🌿'
    },
    assignedDate: '03 Sep 2026',
    dueDate: '15 Sep 2026',
    dueTime: '10:30 AM',
    estimatedHours: 40,
    spentHours: 24,
    remainingHours: 16,
    progressPercentage: 60,
    requirements: [
      'Design a clean, modern and responsive homepage (Desktop + Mobile)',
      'Incorporate the PureAyus brand guidelines (logo, colors, typography)',
      'Showcase key product categories, banner section, and best-selling products',
      'Ensure SEO-friendly structure and fast loading design',
      'Create interactive elements and animations'
    ],
    tasks: [
      { id: '1', title: 'Create wireframe/layout', completed: true },
      { id: '2', title: 'Design homepage UI (Desktop)', completed: true },
      { id: '3', title: 'Design mobile responsive version', completed: false },
      { id: '4', title: 'Prepare asset files (banners, etc.)', completed: false },
      { id: '5', title: 'Review with team leader', completed: false },
      { id: '6', title: 'Make final updates after feedback', completed: false },
      { id: '7', title: 'Deliver Figma file with organized layers', completed: false }
    ],
    additionalNotes: 'Keep the design minimal, user-friendly and focused on conversions. Use clean visuals and maintain consistency with brand identity.',
    attachments: [
      { id: '1', name: 'Brand_Guidelines.pdf', size: '2.4 MB', date: '03 Sep 2026', type: 'pdf', icon: '📄' },
      { id: '2', name: 'Homepage_Reference.png', size: '1.8 MB', date: '03 Sep 2026', type: 'image', icon: '🖼️' },
      { id: '3', name: 'Project_Brief.docx', size: '320 kB', date: '03 Sep 2026', type: 'document', icon: '📋' }
    ],
    activities: [
      {
        id: '1',
        author: { name: 'Rohan Sharma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan' },
        date: '03 Sep 2026',
        time: '10:30 AM',
        message: 'Please follow the attached brand guidelines and complete the initial design by next week.'
      },
      {
        id: '2',
        author: { name: 'Aarya Verma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarya' },
        date: '03 Sep 2026',
        time: '11:15 AM',
        message: 'I have added some reference files. Let me know if you need anything.'
      },
      {
        id: '3',
        author: { name: 'You', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You' },
        date: '03 Sep 2026',
        time: '11:30 AM',
        message: 'Got it, I will start working on the wireframe and share the draft soon.'
      }
    ]
  },
  'pmu-1002': {
    id: 'pmu-1002',
    title: 'Social Media Strategy',
    priority: 'High',
    taskId: '#TAsk-1024',
    status: 'Ongoing',
    taskDescription: 'Develop a comprehensive social media marketing strategy for Q3 content planning including all platforms and engagement tactics.',
    assignedBy: {
      name: 'Priya Patel',
      role: 'Marketing Lead',
      team: 'Marketing Team',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    },
    coWorkers: [
      { name: 'Zari Junction', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zari' },
      { name: 'James Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' }
    ],
    projectDetails: {
      name: 'Social Media Campaign',
      client: 'Zari Junction',
      projectCode: '#PMJ-1002',
      icon: '📱'
    },
    assignedDate: '01 Sep 2026',
    dueDate: '10 Sep 2026',
    dueTime: '02:00 PM',
    estimatedHours: 35,
    spentHours: 20,
    remainingHours: 15,
    progressPercentage: 57,
    requirements: [
      'Analyze current social media performance metrics',
      'Define content pillars and messaging strategy',
      'Create content calendar for all platforms',
      'Design social media graphics and templates',
      'Plan engagement and community management approach',
      'Identify influencer collaboration opportunities'
    ],
    tasks: [
      { id: '1', title: 'Research competitor strategies', completed: true },
      { id: '2', title: 'Define target audience personas', completed: true },
      { id: '3', title: 'Create content calendar', completed: true },
      { id: '4', title: 'Design social templates', completed: false },
      { id: '5', title: 'Plan influencer partnerships', completed: false },
      { id: '6', title: 'Prepare presentation deck', completed: false }
    ],
    additionalNotes: 'Focus on authentic storytelling and community engagement. Include both organic and paid social tactics.',
    attachments: [
      { id: '1', name: 'Social_Media_Analysis.xlsx', size: '1.2 MB', date: '01 Sep 2026', type: 'document', icon: '📊' },
      { id: '2', name: 'Content_Calendar_Template.pdf', size: '890 kB', date: '01 Sep 2026', type: 'pdf', icon: '📅' }
    ],
    activities: [
      {
        id: '1',
        author: { name: 'Priya Patel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
        date: '01 Sep 2026',
        time: '09:00 AM',
        message: 'Please start with competitor analysis and create detailed audience personas.'
      }
    ]
  },
  'pmu-1003': {
    id: 'pmu-1003',
    title: 'Logo Finalization',
    priority: 'Medium',
    taskId: '#TAsk-1025',
    status: 'Ongoing',
    taskDescription: 'Share and finalize logo options for brand identity project. Review multiple variations and select final logo design.',
    assignedBy: {
      name: 'Alex Kumar',
      role: 'Creative Director',
      team: 'Brand Team',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    },
    coWorkers: [
      { name: 'Sofia Martinez', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia' },
      { name: 'Chen Wei', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chen' }
    ],
    projectDetails: {
      name: 'Brand Identity',
      client: 'Cosmetics Inc',
      projectCode: '#PMJ-1003',
      icon: '🎨'
    },
    assignedDate: '04 Sep 2026',
    dueDate: '12 Sep 2026',
    dueTime: '05:00 PM',
    estimatedHours: 30,
    spentHours: 15,
    remainingHours: 15,
    progressPercentage: 50,
    requirements: [
      'Create 3-5 unique logo concepts',
      'Design in multiple color variations',
      'Prepare vector files in AI/EPS format',
      'Provide usage guidelines documentation',
      'Include mockups on various applications',
      'Prepare presentation for client feedback'
    ],
    tasks: [
      { id: '1', title: 'Research brand identity guidelines', completed: true },
      { id: '2', title: 'Sketch initial concepts', completed: true },
      { id: '3', title: 'Design 3 digital logo variations', completed: false },
      { id: '4', title: 'Create color palette variations', completed: false },
      { id: '5', title: 'Prepare mockups', completed: false },
      { id: '6', title: 'Create presentation deck', completed: false }
    ],
    additionalNotes: 'Logo should be timeless, scalable, and work in both color and monochrome versions.',
    attachments: [
      { id: '1', name: 'Brand_Guidelines.pdf', size: '2.1 MB', date: '04 Sep 2026', type: 'pdf', icon: '📄' },
      { id: '2', name: 'Logo_Concepts_Sketch.zip', size: '3.5 MB', date: '04 Sep 2026', type: 'image', icon: '🖼️' }
    ],
    activities: [
      {
        id: '1',
        author: { name: 'Alex Kumar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
        date: '04 Sep 2026',
        time: '10:00 AM',
        message: 'Start with brand research and prepare initial sketches by tomorrow.'
      }
    ]
  },
  'pmu-1004': {
    id: 'pmu-1004',
    title: 'Product Photoshoot',
    priority: 'Medium',
    taskId: '#TAsk-1026',
    status: 'Ongoing',
    taskDescription: 'Plan and execute professional product photography shoot for e-commerce catalog including multiple product angles and lifestyle shots.',
    assignedBy: {
      name: 'Nina Verma',
      role: 'Visual Manager',
      team: 'Media Team',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nina',
    },
    coWorkers: [
      { name: 'Ranit Makeover', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ranit' },
      { name: 'David Park', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' }
    ],
    projectDetails: {
      name: 'Photoshoot',
      client: 'Ranit Makeover',
      projectCode: '#PMJ-1004',
      icon: '📸'
    },
    assignedDate: '05 Sep 2026',
    dueDate: '18 Sep 2026',
    dueTime: '03:00 PM',
    estimatedHours: 50,
    spentHours: 8,
    remainingHours: 42,
    progressPercentage: 16,
    requirements: [
      'Scout and prepare shooting location',
      'Arrange lighting equipment and setup',
      'Schedule models and product preparation',
      'Capture product photography from multiple angles',
      'Take lifestyle and context shots',
      'Organize and deliver edited final images'
    ],
    tasks: [
      { id: '1', title: 'Scout shooting locations', completed: false },
      { id: '2', title: 'Arrange equipment and lighting', completed: false },
      { id: '3', title: 'Schedule models and coordinators', completed: false },
      { id: '4', title: 'Conduct photoshoot', completed: false },
      { id: '5', title: 'Edit and retouch images', completed: false },
      { id: '6', title: 'Deliver final images to client', completed: false }
    ],
    additionalNotes: 'Ensure high-quality product images suitable for e-commerce. Include both flat-lay and lifestyle photography.',
    attachments: [
      { id: '1', name: 'Location_References.pdf', size: '4.2 MB', date: '05 Sep 2026', type: 'pdf', icon: '📄' },
      { id: '2', name: 'Product_List.docx', size: '156 kB', date: '05 Sep 2026', type: 'document', icon: '📋' }
    ],
    activities: [
      {
        id: '1',
        author: { name: 'Nina Verma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nina' },
        date: '05 Sep 2026',
        time: '02:00 PM',
        message: 'Please finalize the shooting schedule and confirm all arrangements by end of week.'
      }
    ]
  },
  'pmu-1005': {
    id: 'pmu-1005',
    title: 'Website Development',
    priority: 'High',
    taskId: '#TAsk-1027',
    status: 'Ongoing',
    taskDescription: 'Develop responsive website pages with modern functionality and performance optimization for PureAyus platform.',
    assignedBy: {
      name: 'Vikram Singh',
      role: 'Development Lead',
      team: 'Dev Team',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
    },
    coWorkers: [
      { name: 'Aisha Khan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha' },
      { name: 'Tom Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom' },
      { name: 'Lisa Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' }
    ],
    projectDetails: {
      name: 'PureAyus Website',
      client: 'PureAyus',
      projectCode: '#PMJ-1005',
      icon: '💻'
    },
    assignedDate: '06 Sep 2026',
    dueDate: '20 Sep 2026',
    dueTime: '06:00 PM',
    estimatedHours: 80,
    spentHours: 35,
    remainingHours: 45,
    progressPercentage: 44,
    requirements: [
      'Develop homepage and landing pages',
      'Create product listing and detail pages',
      'Implement shopping cart and checkout flow',
      'Integrate payment gateway',
      'Ensure responsive design across all devices',
      'Optimize for SEO and performance',
      'Implement user authentication system'
    ],
    tasks: [
      { id: '1', title: 'Setup project structure and dependencies', completed: true },
      { id: '2', title: 'Develop homepage components', completed: true },
      { id: '3', title: 'Create product pages', completed: true },
      { id: '4', title: 'Implement shopping cart functionality', completed: false },
      { id: '5', title: 'Integrate payment gateway', completed: false },
      { id: '6', title: 'Testing and bug fixes', completed: false },
      { id: '7', title: 'Deployment to production', completed: false }
    ],
    additionalNotes: 'Use Next.js/React for frontend. Ensure clean code and proper documentation. Follow company coding standards.',
    attachments: [
      { id: '1', name: 'API_Documentation.pdf', size: '1.8 MB', date: '06 Sep 2026', type: 'pdf', icon: '📄' },
      { id: '2', name: 'Design_Mockups.zip', size: '5.2 MB', date: '06 Sep 2026', type: 'image', icon: '🖼️' },
      { id: '3', name: 'Database_Schema.sql', size: '245 kB', date: '06 Sep 2026', type: 'document', icon: '🗄️' }
    ],
    activities: [
      {
        id: '1',
        author: { name: 'Vikram Singh', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram' },
        date: '06 Sep 2026',
        time: '08:00 AM',
        message: 'Project setup is complete. Start developing the homepage components.'
      },
      {
        id: '2',
        author: { name: 'You', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You' },
        date: '07 Sep 2026',
        time: '04:30 PM',
        message: 'Homepage is done. Moving on to product pages next.'
      }
    ]
  }
};