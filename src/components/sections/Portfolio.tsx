import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Github } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

const categories = ['All', 'Web Development', 'Mobile Apps', 'UI/UX Design', 'E-commerce']

const projects = [
  // --- Proyek dari Dzikri (Format Disesuaikan) ---
  {
    id: 1,
    title: "KampEase",
    category: 'Web Development',
    description: "A web-based platform designed to simplify campus navigation and enhance the daily experience of students, staff, and visitors.",
    image: "https://images.pexels.com/photos/33314541/pexels-photo-33314541.jpeg",
    technologies: ["PHP", "MySQL", "OpenStreetMaps API", "Javascript"],
    liveUrl: '#',
    githubUrl: "https://github.com/dzikriii24/KampEase"
  },
  {
    id: 2,
    title: "Sea Salon",
    category: 'Web Development',
    description: "A web-based application designed to help customers book salon services online easily, quickly, and flexibly.",
    image: "https://images.pexels.com/photos/33314756/pexels-photo-33314756.jpeg",
    technologies: ["PHP", "MySQL", "JavaScript", "Tailwind"],
    liveUrl: '#',
    githubUrl: "https://github.com/dzikriii24/seasalon2"
  },
  {
    id: 3,
    title: "Canteen Go",
    category: 'Web Development',
    description: "A digital web platform to support the sale and promotion of local food products, especially from small and medium enterprises (UMKM).",
    image: "https://images.pexels.com/photos/33315015/pexels-photo-33315015.jpeg",
    technologies: ["PHP", "PHP Library", "JavaScript", "Tailwind", "MySQL"],
    liveUrl: '#',
    githubUrl: "https://github.com/dzikriii24/CanteenGo_code"
  },
  {
    id: 4,
    title: "Smart POS System",
    category: 'Desktop App',
    description: "A lightweight and user-friendly cashier app to simplify sales, manage inventory, and generate real-time reports.",
    image: "https://images.pexels.com/photos/33319037/pexels-photo-33319037.jpeg",
    technologies: ["Java", "Java Swing"],
    liveUrl: '#',
    githubUrl: "https://github.com/dzikriii24/supermarketGUI"
  },
  {
    id: 5,
    title: "Smart Laundry App",
    category: 'Web Development',
    description: "A lightweight app to simplify order recording, track laundry progress, and manage customer data efficiently.",
    image: "https://images.pexels.com/photos/33319538/pexels-photo-33319538.jpeg",
    technologies: ["Java", "Spring Boot", "MySQL", "H2 Database"],
    liveUrl: '#',
    githubUrl: "https://github.com/dzikriii24/SpringBoot"
  },
  {
    id: 6,
    title: "Digital Wedding Invitation",
    category: 'Web Development',
    description: "An elegant, personal, and practical way to invite guests, manage RSVPs, and share your love story online.",
    image: "https://images.pexels.com/photos/33319918/pexels-photo-33319918.jpeg",
    technologies: ["HTML", "SASS", "JavaScript", "Tailwind"],
    liveUrl: "https://dzikriii24.github.io/1sUndangan/",
    githubUrl: "#"
  },
  {
    id: 7,
    title: "Tanduria",
    category: 'IoT & Web App',
    description: "An accessible smart farming solution with field monitoring, weather prediction, and IoT-based smart irrigation.",
    image: "https://images.pexels.com/photos/33320664/pexels-photo-33320664.jpeg",
    technologies: ["PHP", "Flask", "API Development", "MySQL", "IoT"],
    liveUrl: '#',
    githubUrl: "https://github.com/dzikriii24/tanduria"
  },
  
  // --- Proyek Baru Ditambahkan ---
  {
    id: 8,
    title: 'Cafe Menu & Order System',
    category: 'Web Development',
    description: 'A digital menu system for cafes and restaurants, complete with a real-time order management dashboard for the kitchen.',
    image: 'https://i.pinimg.com/736x/54/af/46/54af46b48f2400b14b9d89e85c946123.jpg',
    technologies: ['React', 'Node.js', 'Socket.IO', 'PostgreSQL'],
    liveUrl: '#',
    githubUrl: '#'
  },
  {
    id: 9,
    title: 'Modern Company Profile',
    category: 'Web Development',
    description: 'A sleek, professional, and fully responsive website to build a strong online presence and attract potential clients.',
    image: 'https://i.pinimg.com/1200x/42/de/a5/42dea5d2f6078cd11c59b879f3b1b020.jpg',
    technologies: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'Headless CMS'],
    liveUrl: '#',
    githubUrl: '#'
  },

  // --- Proyek dari Data Awal ---
  {
    id: 10,
    title: 'E-commerce Platform',
    category: 'E-commerce',
    description: 'Modern e-commerce solution with advanced features and seamless user experience.',
    image: 'https://images.pexels.com/photos/7667442/pexels-photo-7667442.jpeg',
    technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    liveUrl: '#',
    githubUrl: '#'
  },
  {
    id: 11,
    title: 'Healthcare Mobile App',
    category: 'Mobile Apps',
    description: 'Comprehensive healthcare management app with appointment booking and telemedicine.',
    image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800',
    technologies: ['React Native', 'Firebase', 'Redux', 'WebRTC'],
    liveUrl: '#',
    githubUrl: '#'
  },
  {
    id: 12,
    title: 'Financial Dashboard',
    category: 'Web Development',
    description: 'Real-time financial analytics dashboard with advanced data visualization.',
    image: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800',
    technologies: ['Next.js', 'TypeScript', 'D3.js', 'PostgreSQL'],
    liveUrl: '#',
    githubUrl: '#'
  },
  {
    id: 13,
    title: 'Restaurant Brand Identity',
    category: 'UI/UX Design',
    description: 'Complete brand identity and digital experience for premium restaurant chain.',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    technologies: ['Figma', 'Adobe Suite', 'Prototyping'],
    liveUrl: '#',
    githubUrl: '#'
  },
  {
    id: 14,
    title: 'Learning Management System',
    category: 'Web Development',
    description: 'Comprehensive LMS with video streaming, assessments, and progress tracking.',
    image: 'https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=800',
    technologies: ['Vue.js', 'Laravel', 'MySQL', 'AWS'],
    liveUrl: '#',
    githubUrl: '#'
  },
  {
    id: 15,
    title: 'Fitness Tracking App',
    category: 'Mobile Apps',
    description: 'Social fitness app with workout tracking, challenges, and community features.',
    image: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=800',
    technologies: ['Flutter', 'Firebase', 'Google Fit API'],
    liveUrl: '#',
    githubUrl: '#'
  }
];


export const Portfolio: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All')

  const filteredProjects = activeCategory === 'All' 
    ? projects 
    : projects.filter(project => project.category === activeCategory)

  return (
    <section id="portfolio" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Our Portfolio
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore our latest projects and see how we've helped businesses achieve their digital goals.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'primary' : 'ghost'}
              onClick={() => setActiveCategory(category)}
              className="transition-all duration-300"
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden group">
                  <div className="relative overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                      {project.category}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {project.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* View More */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-12"
        >
        </motion.div>
      </div>
    </section>
  )
}