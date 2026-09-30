import React from 'react'
import { motion } from 'framer-motion'
import CircularCarousel from '../ui/CircularCarousel'
import { useTheme } from '../../hooks/useTheme'

const projects = [
  // --- Proyek dari Dzikri (Format Disesuaikan) ---
  {
    id: 1,
    title: "KampEase",
    category: 'Web Development',
    description: "A web-based platform designed to simplify campus navigation and enhance the daily experience of students, staff, and visitors.",
    image: "https://images.pexels.com/photos/33314541/pexels-photo-33314541.jpeg",
    githubUrl: "https://github.com/dzikriii24/KampEase"
  },
  {
    id: 2,
    title: "Sea Salon",
    category: 'Web Development',
    description: "A web-based application designed to help customers book salon services online easily, quickly, and flexibly.",
    image: "https://images.pexels.com/photos/33314756/pexels-photo-33314756.jpeg",
    githubUrl: "https://github.com/dzikriii24/seasalon2"
  },
  {
    id: 3,
    title: "Canteen Go",
    category: 'Web Development',
    description: "A digital web platform to support the sale and promotion of local food products, especially from small and medium enterprises (UMKM).",
    image: "https://images.pexels.com/photos/33315015/pexels-photo-33315015.jpeg",
    githubUrl: "https://github.com/dzikriii24/CanteenGo_code"
  },
  {
    id: 4,
    title: "Smart POS System",
    category: 'Desktop App',
    description: "A lightweight and user-friendly cashier app to simplify sales, manage inventory, and generate real-time reports.",
    image: "https://images.pexels.com/photos/33319037/pexels-photo-33319037.jpeg",
    githubUrl: "https://github.com/dzikriii24/supermarketGUI"
  },
  {
    id: 5,
    title: "Smart Laundry App",
    category: 'Web Development',
    description: "A lightweight app to simplify order recording, track laundry progress, and manage customer data efficiently.",
    image: "https://images.pexels.com/photos/33319538/pexels-photo-33319538.jpeg",
    githubUrl: "https://github.com/dzikriii24/SpringBoot"
  },
  {
    id: 6,
    title: "Digital Wedding Invitation",
    category: 'Web Development',
    description: "An elegant, personal, and practical way to invite guests, manage RSVPs, and share your love story online.",
    image: "https://images.pexels.com/photos/33319918/pexels-photo-33319918.jpeg",
    liveUrl: "https://dzikriii24.github.io/1sUndangan/",
  },
  {
    id: 7,
    title: "Tanduria",
    category: 'IoT & Web App',
    description: "An accessible smart farming solution with field monitoring, weather prediction, and IoT-based smart irrigation.",
    image: "https://images.pexels.com/photos/33320664/pexels-photo-33320664.jpeg",
    githubUrl: "https://github.com/dzikriii24/tanduria"
  },
  {
    id: 8,
    title: 'M E N U',
    category: 'Web Development',
    description: 'A digital menu system for cafes and restaurants, complete with a real-time order management dashboard for the kitchen.',
    image: 'https://i.pinimg.com/736x/54/af/46/54af46b48f2400b14b9d89e85c946123.jpg',
    githubUrl: 'https://menu1s.my.canva.site/'
  },
  {
    id: 9,
    title: 'Modern Company Profile',
    category: 'Web Development',
    description: 'A sleek, professional, and fully responsive website to build a strong online presence and attract potential clients.',
    image: 'https://i.pinimg.com/1200x/42/de/a5/42dea5d2f6078cd11c59b879f3b1b020.jpg',
    githubUrl: 'https://1s-labs.vercel.app/'
  },
  {
    id: 10,
    title: 'E-commerce Platform',
    category: 'E-commerce',
    description: 'Modern e-commerce solution with advanced features and seamless user experience.',
    image: 'https://images.pexels.com/photos/7667442/pexels-photo-7667442.jpeg',
  },
  {
    id: 11,
    title: 'Healthcare Mobile App',
    category: 'Mobile Apps',
    description: 'Comprehensive healthcare management app with appointment booking and telemedicine.',
    image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 12,
    title: 'Financial Dashboard',
    category: 'Web Development',
    description: 'Real-time financial analytics dashboard with advanced data visualization.',
    image: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 13,
    title: 'Restaurant Brand Identity',
    category: 'UI/UX Design',
    description: 'Complete brand identity and digital experience for premium restaurant chain.',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 14,
    title: 'Learning Management System',
    category: 'Web Development',
    description: 'Comprehensive LMS with video streaming, assessments, and progress tracking.',
    image: 'https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 15,
    title: 'Fitness Tracking App',
    category: 'Mobile Apps',
    description: 'Social fitness app with workout tracking, challenges, and community features.',
    image: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=800',
  }
];

const carouselItems = projects.map(p => ({
  src: p.image,
  alt: p.title,
  title: p.title,
  subtitle: p.category,
  description: p.description,
  link: (p as any).githubUrl || (p as any).liveUrl || '#'
}));

export const Portfolio: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleItemClick = (item: any) => {
    if (item.link && item.link !== '#') {
      window.open(item.link, '_blank');
    }
  };

  return (
    <section id="portfolio" className="py-20 bg-white dark:bg-gray-900 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Our Portfolio
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore our latest projects and see how we've helped businesses achieve their digital goals.
          </p>
        </motion.div>
      </div>

      <div style={{ width: '100%', height: '600px', position: 'relative' }}>
        <CircularCarousel
          items={carouselItems}
          preset="panorama"
          intro="rise"
          cardWidth={236}
          aspectRatio={0.75}
          speed={14}
          captions={true}
          gap={36}
          tilt={0}
          curve={0.57}
          perspective={1800}
          autoplay="step"
          parallax={0.39}
          stretch={0.6}
          depthFade={0.7}
          fadeColor={isDark ? '#111827' : '#ffffff'}
          onItemClick={handleItemClick}
        />
      </div>
    </section>
  )
}