import React from 'react'
import { motion } from 'framer-motion'
import { Code, Smartphone, Globe, Palette, Database, Shield } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

const services = [
  {
    icon: Code,
    title: 'Web Development',
    description: 'Custom websites and web applications built with modern technologies and best practices.',
    features: ['React & Next.js', 'Node.js Backend', 'Database Design', 'API Integration', 'PHP'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Smartphone,
    title: 'Mobile Development',
    description: 'Native and cross-platform mobile apps that deliver exceptional user experiences.',
    features: ['iOS & Android', 'React Native', 'Flutter', 'App Store Optimization'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Palette,
    title: 'UI/UX Design',
    description: 'Beautiful, intuitive designs that convert visitors into customers.',
    features: ['User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
    color: 'from-orange-500 to-red-500'
  },
]

export const Services: React.FC = () => {
  return (
    <section id="services" className="py-10 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            We offer comprehensive digital solutions to help your business thrive in the modern world.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Card className="p-8 h-full group">
                <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {service.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {service.description}
                </p>

                <ul className="space-y-2 mb-8">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>

              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-16"
        >
          <div className="relative z-10 flex flex-col items-center text-center">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4">
              Ready to Transform Your Business?
            </h3>
            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl">
              Let's discuss how we can help you achieve your digital goals. Get a free quote, no strings attached.
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const element = document.getElementById('contact')
                if (element) element.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Start Your Project
            </Button>
          </div>

        </motion.div>
      </div>
    </section>
  )
}