"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CircularCarousel from '../ui/CircularCarousel';
import { useTheme } from '../../hooks/useTheme';
import { ExternalLink, Github, FolderGit2, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ProjectItem {
  id: number;
  title: string;
  category: string;
  type: 'enterprise' | 'ai-automation' | 'business' | 'iot-specialized';
  description: string;
  role: string;
  techStack: string[];
  image: string;
  githubUrl?: string;
  liveUrl?: string;
}

const verifiedProjects: ProjectItem[] = [
  {
    id: 1,
    title: "Vocallet",
    category: "AI & Financial Inclusion",
    type: "ai-automation",
    description: "Sistem pencatatan keuangan dan kalkulasi zakat inklusif berbasis perintah suara (voice-command) untuk santriwati tunanetra dan digitalisasi kasir 22 UMKM (Riset Terpublikasi).",
    role: "Fullstack & DevOps Engineer",
    techStack: ["React.js", "Node.js", "Express", "Microservices", "AI Audio Processing", "MySQL", "VPS"],
    image: "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=900"
  },
  {
    id: 2,
    title: "DPD RI Enterprise Systems",
    category: "Enterprise Web Platform",
    type: "enterprise",
    description: "Platform web terpadu untuk pencatatan inventaris gudang dan pemantauan harian petugas lapangan di lingkungan Dewan Perwakilan Daerah RI Jawa Barat.",
    role: "Project Manager & Fullstack Developer",
    techStack: ["Next.js", "Tailwind CSS", "Supabase", "PostgreSQL", "Vercel"],
    image: "https://i.pinimg.com/736x/05/c2/13/05c213954aab8dbdd4e10dcf0634e0f1.jpg"
  },
  {
    id: 3,
    title: "Saffix.id",
    category: "Fullstack SaaS Platform",
    type: "enterprise",
    description: "Aplikasi web end-to-end dengan RESTful API scalable dan panel admin interaktif untuk operasional layanan digital terintegrasi cloud database.",
    role: "Fullstack Developer",
    techStack: ["TypeScript", "React (TSX)", "REST APIs", "PostgreSQL (Aiven Cloud)", "Render"],
    image: "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=900"
  },
  {
    id: 4,
    title: "Yuk-Mari Platform",
    category: "Backend Architecture & Admin",
    type: "enterprise",
    description: "Rekayasa arsitektur backend RESTful API dan modul admin panel TSX untuk modernisasi sistem bisnis dengan database cloud berkecepatan tinggi.",
    role: "Backend Developer",
    techStack: ["TypeScript", "PHP", "TSX Admin Panel", "PostgreSQL", "Render"],
    image: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=900",
    liveUrl: "https://yuk-mari.com/"
  },
  {
    id: 5,
    title: "Sportify.id",
    category: "Sports Venue Booking Portal",
    type: "business",
    description: "Portal profil perusahaan dan sistem pemesanan online reservasi lapangan olahraga dari nol, lengkap dengan konfigurasi VPS dan optimasi SEO.",
    role: "Fullstack Developer & PM",
    techStack: ["PHP", "JavaScript", "Tailwind CSS", "VPS Hosting", "SEO Optimization"],
    image: "https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=900"
  },
  {
    id: 6,
    title: "Autism Smart Assistant",
    category: "AI Assistive Technology",
    type: "ai-automation",
    description: "Platform web interaktif terintegrasi modul asisten AI pintar untuk mendukung kelancaran komunikasi dan stimulasi kognitif pengguna berkebutuhan khusus.",
    role: "AI Engineer & Web Developer",
    techStack: ["Python", "Machine Learning", "TypeScript", "REST API", "Render"],
    image: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=900"
  },
  {
    id: 7,
    title: "Yareunsnap",
    category: "AI Image Processing",
    type: "ai-automation",
    description: "Layanan pengolahan citra dan transformasi gambar digital berbasis deep learning dengan RESTful API microservice di lingkungan cloud.",
    role: "AI Engineer",
    techStack: ["Python", "Deep Learning", "TypeScript", "Aiven Cloud", "Render"],
    image: "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=900"
  },
  {
    id: 8,
    title: "KampEase / Unicamp",
    category: "Campus Academic Services",
    type: "enterprise",
    description: "Platform navigasi kampus dan informasi titik penting (POI) berbasis web untuk mempermudah civitas akademika dan pengunjung kampus.",
    role: "Fullstack Developer",
    techStack: ["PHP", "MySQL", "OpenStreetMap API", "JavaScript", "Tailwind"],
    image: "https://images.pexels.com/photos/33314541/pexels-photo-33314541.jpeg?auto=compress&cs=tinysrgb&w=900",
    githubUrl: "https://github.com/dzikriii24/KampEase"
  },
  {
    id: 9,
    title: "Tanduria",
    category: "IoT & Smart Agriculture",
    type: "iot-specialized",
    description: "Aplikasi agrikultur cerdas terintegrasi sensor IoT dengan visualisasi data lingkungan, prediksi jadwal tanam, dan analitik secara real-time.",
    role: "Project Manager & Fullstack Dev",
    techStack: ["PHP", "Flask", "MySQL", "Chart.js", "IoT Sensors", "Tailwind CSS"],
    image: "https://images.pexels.com/photos/33320664/pexels-photo-33320664.jpeg?auto=compress&cs=tinysrgb&w=900",
    githubUrl: "https://github.com/dzikriii24/tanduria"
  },
  {
    id: 10,
    title: "Sea Salon",
    category: "Booking & Salon Operations",
    type: "business",
    description: "Aplikasi reservasi layanan salon online responsif yang mempermudah pelanggan menjadwalkan perawatan dan membantu salon mengelola antrean.",
    role: "Fullstack Developer",
    techStack: ["PHP", "MySQL", "JavaScript", "Tailwind CSS"],
    image: "https://images.pexels.com/photos/33314756/pexels-photo-33314756.jpeg?auto=compress&cs=tinysrgb&w=900",
    githubUrl: "https://github.com/dzikriii24/seasalon2"
  },
  {
    id: 11,
    title: "Smart POS System",
    category: "Retail Cashier & Inventory",
    type: "business",
    description: "Aplikasi kasir desktop modern yang efisien untuk mencatat transaksi penjualan ritel, mengontrol stok barang, dan menyusun laporan laba.",
    role: "Software Developer",
    techStack: ["Java", "Java Swing", "MySQL", "Desktop Architecture"],
    image: "https://images.pexels.com/photos/33319037/pexels-photo-33319037.jpeg?auto=compress&cs=tinysrgb&w=900",
    githubUrl: "https://github.com/dzikriii24/supermarketGUI"
  },
  {
    id: 12,
    title: "Smart Laundry App",
    category: "Business Operations Workflow",
    type: "business",
    description: "Aplikasi manajemen operasional laundry untuk mencatat status pesanan kiloan/satuan, progres pencucian, serta histori pelanggan secara rapi.",
    role: "Backend & Software Developer",
    techStack: ["Java Spring Boot", "MySQL", "H2 Database", "REST API"],
    image: "https://images.pexels.com/photos/33319538/pexels-photo-33319538.jpeg?auto=compress&cs=tinysrgb&w=900",
    githubUrl: "https://github.com/dzikriii24/SpringBoot"
  },
  {
    id: 13,
    title: "Digital Wedding (1sUndangan)",
    category: "Interactive Digital Invitation",
    type: "business",
    description: "Platform undangan pernikahan digital elegan dengan fitur RSVP interaktif, galeri foto, cerita pasangan, dan integrasi peta lokasi acara.",
    role: "Frontend Developer",
    techStack: ["HTML5", "SASS", "JavaScript", "Tailwind CSS"],
    image: "https://images.pexels.com/photos/33319918/pexels-photo-33319918.jpeg?auto=compress&cs=tinysrgb&w=900",
    liveUrl: "https://dzikriii24.github.io/1sUndangan/"
  },
  {
    id: 14,
    title: "Canteen Go",
    category: "Campus Culinary UMKM",
    type: "business",
    description: "Platform digital untuk mendukung pemasaran produk makanan UMKM di lingkungan kampus dengan antarmuka katalog pemesanan yang mudah.",
    role: "Fullstack Developer",
    techStack: ["PHP", "MySQL", "JavaScript", "Tailwind CSS"],
    image: "https://images.pexels.com/photos/33315015/pexels-photo-33315015.jpeg?auto=compress&cs=tinysrgb&w=900",
    githubUrl: "https://github.com/dzikriii24/CanteenGo_code"
  },
  {
    id: 15,
    title: "Automasi API Perpustakaan UIN",
    category: "API Bridge & Analytics",
    type: "enterprise",
    description: "Pengembangan jembatan API untuk transmisi dan sinkronisasi data katalog OpenBiblio ke SLiMS, meningkatkan efisiensi transfer data hingga 80%.",
    role: "Web Developer & IT Support",
    techStack: ["PHP", "MySQL", "REST API", "Chart.js", "SLiMS", "OpenBiblio"],
    image: "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=900"
  }
];

const filterCategories = [
  { id: 'all', label: 'All Projects' },
  { id: 'enterprise', label: 'Enterprise & Web Apps' },
  { id: 'ai-automation', label: 'AI & Data Processing' },
  { id: 'business', label: 'Business & POS Systems' },
  { id: 'iot-specialized', label: 'IoT & Smart Solutions' }
];

export const Portfolio: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  const filteredProjects = activeFilter === 'all'
    ? verifiedProjects
    : verifiedProjects.filter(p => p.type === activeFilter);

  const carouselItems = verifiedProjects.map(p => ({
    src: p.image,
    alt: p.title,
    title: p.title,
    subtitle: p.category,
    description: p.description,
    link: p.githubUrl || p.liveUrl || '#'
  }));

  const handleItemClick = (item: { title: string; link?: string }) => {
    const found = verifiedProjects.find(p => p.title === item.title);
    if (found) {
      setSelectedProject(found);
    } else if (item.link && item.link !== '#') {
      window.open(item.link, '_blank');
    }
  };

  return (
    <section id="portfolio" className="py-10 sm:py-20 md:py-28 bg-white dark:bg-gray-900 overflow-hidden relative font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-6 sm:mb-12">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2.5 sm:mb-5 tracking-tight font-['Mori',_sans-serif]">
            Real Projects &amp; Proven Solutions
          </h2>
          <p className="text-xs sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed px-2">
            Eksplorasi portofolio proyek yang benar-benar pernah dibangun dan dikembangkan—mulai dari platform enterprise, automasi AI, hingga sistem bisnis dan IoT.
          </p>
        </motion.div>
      </div>

      {/* 3D Panorama Circular Carousel: Responsive Height */}
      <div className="w-full h-[360px] sm:h-[460px] md:h-[560px] relative mb-8 sm:mb-14">
        <CircularCarousel
          items={carouselItems}
          preset="panorama"
          intro="rise"
          cardWidth={240}
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

      {/* Filter Tabs & Grid Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {filterCategories.map((cat) => {
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Project Cards Grid: 2 Columns on Mobile, 3 on Desktop */}
        <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 md:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, idx) => (
              <motion.div
                layout
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                onClick={() => setSelectedProject(project)}
                className="bg-white dark:bg-neutral-900/70 rounded-2xl sm:rounded-3xl border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xl dark:hover:shadow-neutral-950/40 transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Image Cover */}
                  <div className="relative h-28 sm:h-44 md:h-48 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] sm:text-[11px] font-medium">
                      {project.category}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-2.5 sm:p-5 md:p-6">
                    <h3 className="text-xs sm:text-base md:text-xl font-bold text-neutral-900 dark:text-white mb-0.5 sm:mb-1.5 tracking-tight line-clamp-1 leading-snug">
                      {project.title}
                    </h3>
                    <div className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5 sm:mb-3 line-clamp-1">
                      {project.role}
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-neutral-600 dark:text-neutral-400 leading-snug sm:leading-relaxed line-clamp-2 mb-2 sm:mb-4">
                      {project.description}
                    </p>

                    {/* Tech Stack Pills (visible on tablet/desktop) */}
                    <div className="hidden sm:flex flex-wrap gap-1.5 mb-4">
                      {project.techStack.map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-2.5 sm:px-6 pb-2.5 sm:pb-5 pt-1.5 sm:pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[9px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 sm:gap-1">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Verified Project</span><span className="sm:hidden">Verified</span>
                  </span>

                  <div className="flex items-center gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 transition-colors"
                      >
                        <Github className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Code</span>
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Visit</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modal Detail for Item Click if opened */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProject(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-neutral-200 dark:border-neutral-700 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              {selectedProject.title}
            </h3>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3">
              {selectedProject.category} &bull; {selectedProject.role}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
              {selectedProject.description}
            </p>
            <div className="mb-6">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Technologies
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedProject.techStack.map((tech, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>
                Close
              </Button>
              {selectedProject.githubUrl && (
                <Button variant="secondary" size="sm" onClick={() => window.open(selectedProject.githubUrl, '_blank')}>
                  <Github className="w-4 h-4 mr-1.5" /> View Repo
                </Button>
              )}
              {selectedProject.liveUrl && (
                <Button variant="primary" size="sm" onClick={() => window.open(selectedProject.liveUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-1.5" /> Live Preview
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export default Portfolio;