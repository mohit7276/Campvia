import { Course, StatItem, NavLink } from './types';

export const NAV_LINKS: NavLink[] = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Courses', href: '#programs' },
    { name: 'Contact', href: '#contact' },
];

export const STATS: StatItem[] = [
    { label: 'Active Students', value: '15', suffix: 'K+' },
    { label: 'World-Class Faculty', value: '350', suffix: '+' },
    { label: 'Degree Programs', value: '85', suffix: '+' },
    { label: 'Global Ranking', value: '#', suffix: '12' },
];

export const TESTIMONIALS = [
    {
        name: "Sarah Jenkins",
        role: "Computer Science '23",
        content: "The research opportunities at Campvia changed my career trajectory. I'm now at Google thanks to the faculty mentors here.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
        name: "David Chen",
        role: "MBA Candidate",
        content: "The networking events and industry connections provided by the business school are unparalleled in the region.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
        name: "Elena Rodriguez",
        role: "Design Student",
        content: "The creative freedom coupled with high-end tech labs allowed me to push the boundaries of my digital art.",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80"
    }
];

export const COURSES: Course[] = [
    {
        id: 'c1',
        title: 'Advanced Computer Science',
        category: 'Engineering',
        duration: '4 Years',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
        description: 'Master the fundamentals of AI, Machine Learning, and Cloud Architecture with high-impact industry projects.',
        rating: 4.9
    },
    {
        id: 'c2',
        title: 'Global Business Strategy',
        category: 'Management',
        duration: '3 Years',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        description: 'Develop strategic leadership skills and engage in global economic research to lead tomorrow’s enterprises.',
        rating: 4.7
    },
    {
        id: 'c3',
        title: 'Interaction Design',
        category: 'Arts',
        duration: '3 Years',
        image: 'https://images.unsplash.com/photo-1561070791-26c11d6d9e3d?auto=format&fit=crop&w=800&q=80',
        description: 'A synergy of cognitive psychology and digital aesthetics to architect the next generation of user interfaces.',
        rating: 4.8
    },
    {
        id: 'c4',
        title: 'Genomic Engineering',
        category: 'Science',
        duration: '4 Years',
        image: 'https://images.unsplash.com/photo-1532187875605-2fe35851142b?auto=format&fit=crop&w=800&q=80',
        description: 'Investigate the frontiers of molecular biology and genetic therapeutics through rigorous laboratory research.',
        rating: 4.6
    },
    {
        id: 'c5',
        title: 'Cyber Security Operations',
        category: 'Engineering',
        duration: '4 Years',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
        description: 'Forge an elite career in digital defense with advanced ethical hacking and network security protocols.',
        rating: 4.9
    },
    {
        id: 'c6',
        title: 'Economics & Policy',
        category: 'Management',
        duration: '3 Years',
        image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
        description: 'Analyze complex global markets and formulate transformative economic policies for public and private sectors.',
        rating: 4.5
    }
];
