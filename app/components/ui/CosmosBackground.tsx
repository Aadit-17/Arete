'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StarField = () => {
    const [stars, setStars] = useState<{
        id: number;
        size: number;
        top: string;
        left: string;
        duration: number;
        delay: number;
    }[]>([]);

    useEffect(() => {
        const generatedStars = [...Array(120)].map((_, i) => ({
            id: i,
            size: Math.random() * 2 + 1,
            top: Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
            duration: 3 + Math.random() * 7,
            delay: Math.random() * 5
        }));
        setStars(generatedStars);
    }, []);

    if (stars.length === 0) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    className="absolute bg-white rounded-full opacity-0"
                    style={{
                        width: star.size,
                        height: star.size,
                        top: star.top,
                        left: star.left,
                    }}
                    animate={{
                        opacity: [0, 0.7, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: star.duration,
                        repeat: Infinity,
                        delay: star.delay,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
};

const Nebula = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <motion.div
            className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(0,10,25,0.4)_0%,rgba(0,0,0,0)_70%)]"
            animate={{
                rotate: [0, 360],
            }}
            transition={{
                duration: 200,
                repeat: Infinity,
                ease: "linear",
            }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />
    </div>
);

const GrainyPlanet = ({ color, size, top, left, delay = 0, duration = 20 }: any) => {
    return (
        <motion.div
            className="absolute rounded-full pointer-events-none overflow-hidden blur-[1px]"
            style={{
                width: size,
                height: size,
                top,
                left,
                background: `radial-gradient(circle at 30% 30%, ${color}, transparent)`,
                boxShadow: `0 0 60px ${color}33`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.05, 1],
                y: [0, -20, 0],
            }}
            transition={{
                duration,
                repeat: Infinity,
                delay,
                ease: "easeInOut",
            }}
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/40" />
        </motion.div>
    );
};

const Comet = () => {
    const [comets, setComets] = useState<any[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const id = Math.random();
            const startX = Math.random() * 100;
            const startY = Math.random() * 50;

            setComets(prev => [...prev, { id, startX, startY }]);

            setTimeout(() => {
                setComets(prev => prev.filter(c => c.id !== id));
            }, 3000);
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <AnimatePresence>
                {comets.map(comet => (
                    <motion.div
                        key={comet.id}
                        initial={{
                            x: `${comet.startX}%`,
                            y: `${comet.startY}%`,
                            opacity: 0,
                            scale: 0,
                            rotate: 45
                        }}
                        animate={{
                            x: `${comet.startX + 20}%`,
                            y: `${comet.startY + 40}%`,
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute w-[2px] h-[100px] bg-gradient-to-b from-aura-accent to-transparent"
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export const CosmosBackground = () => {
    return (
        <div className="fixed inset-0 z-0 bg-[#020202] overflow-hidden pointer-events-none">
            <Nebula />
            <StarField />
            <GrainyPlanet
                color="#00f5ff"
                size={400}
                top="15%"
                left="-5%"
                duration={25}
            />
            <GrainyPlanet
                color="#3b82f6"
                size={300}
                top="60%"
                left="75%"
                delay={5}
                duration={30}
            />
            <GrainyPlanet
                color="#8b5cf6"
                size={150}
                top="10%"
                left="85%"
                delay={2}
                duration={15}
            />
            <Comet />
            {/* Global Grain */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
        </div>
    );
};
