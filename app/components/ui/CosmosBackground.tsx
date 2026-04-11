'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

/** Deterministic 0..1 from index (pure — safe in render). */
function starFactor(i: number, salt: number) {
    const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
}

const GalaxyBackdrop = () => (
    <>
        <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            aria-hidden
        >
                       <div
                className="absolute inset-[-15%] opacity-[0.32] scale-[1.12]"
                style={{
                    backgroundImage: 'url(/galaxy-bg.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(52px)',
                    WebkitFilter: 'blur(52px)',
                }}
            />
        </div>
        <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#020202]/65 via-[#020202]/52 to-[#020202]/72"
            aria-hidden
        />
    </>
);

const StarField = ({ reducedMotion }: { reducedMotion: boolean }) => {
    const stars = useMemo(() => {
        if (reducedMotion) return [];
        return [...Array(88)].map((_, i) => ({
            id: i,
            size: starFactor(i, 1) * 2 + 1,
            top: starFactor(i, 2) * 100 + '%',
            left: starFactor(i, 3) * 100 + '%',
            duration: 4 + starFactor(i, 4) * 8,
            delay: starFactor(i, 5) * 5,
        }));
    }, [reducedMotion]);

    if (stars.length === 0) return null;

    const peakOpacity = 0.48;

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
                        opacity: [0, peakOpacity, 0],
                        scale: [1, 1.15, 1],
                    }}
                    transition={{
                        duration: star.duration,
                        repeat: Infinity,
                        delay: star.delay,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
};

const Nebula = ({ reducedMotion }: { reducedMotion: boolean }) => (
    <div
        className={`absolute inset-0 overflow-hidden pointer-events-none ${reducedMotion ? 'opacity-10' : 'opacity-20'}`}
    >
        <motion.div
            className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(0,10,25,0.4)_0%,rgba(0,0,0,0)_70%)]"
            animate={
                reducedMotion
                    ? { rotate: 0 }
                    : {
                          rotate: [0, 360],
                      }
            }
            transition={{
                duration: reducedMotion ? 0 : 200,
                repeat: reducedMotion ? 0 : Infinity,
                ease: 'linear',
            }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />
    </div>
);

const GrainyPlanet = ({
    color,
    size,
    top,
    left,
    delay = 0,
    duration = 20,
    reducedMotion,
}: {
    color: string;
    size: number;
    top: string;
    left: string;
    delay?: number;
    duration?: number;
    reducedMotion: boolean;
}) => {
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
            animate={
                reducedMotion
                    ? { opacity: 0.28, scale: 1, y: 0 }
                    : {
                          opacity: [0.18, 0.34, 0.18],
                          scale: [1, 1.05, 1],
                          y: [0, -20, 0],
                      }
            }
            transition={{
                duration: reducedMotion ? 0.6 : duration,
                repeat: reducedMotion ? 0 : Infinity,
                delay: reducedMotion ? 0 : delay,
                ease: 'easeInOut',
            }}
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/40" />
        </motion.div>
    );
};

const Comet = ({ reducedMotion }: { reducedMotion: boolean }) => {
    const [comets, setComets] = useState<
        { id: number; startX: number; startY: number }[]
    >([]);

    useEffect(() => {
        if (reducedMotion) return;
        const interval = setInterval(() => {
            const id = Math.random();
            const startX = Math.random() * 100;
            const startY = Math.random() * 50;

            setComets((prev) => [...prev, { id, startX, startY }]);

            setTimeout(() => {
                setComets((prev) => prev.filter((c) => c.id !== id));
            }, 3000);
        }, 8000);

        return () => clearInterval(interval);
    }, [reducedMotion]);

    if (reducedMotion) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <AnimatePresence>
                {comets.map((comet) => (
                    <motion.div
                        key={comet.id}
                        initial={{
                            x: `${comet.startX}%`,
                            y: `${comet.startY}%`,
                            opacity: 0,
                            scale: 0,
                            rotate: 45,
                        }}
                        animate={{
                            x: `${comet.startX + 20}%`,
                            y: `${comet.startY + 40}%`,
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 2.1,
                            ease: easeOutExpo,
                        }}
                        className="absolute w-[2px] h-[100px] bg-gradient-to-b from-aura-accent to-transparent"
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export const CosmosBackground = () => {
    const reducedMotion = useReducedMotion() ?? false;

    return (
        <div className="fixed inset-0 z-0 bg-[#020202] overflow-hidden pointer-events-none">
            <GalaxyBackdrop />
            <Nebula reducedMotion={reducedMotion} />
            <StarField reducedMotion={reducedMotion} />
            <GrainyPlanet
                color="#00f5ff"
                size={400}
                top="15%"
                left="-5%"
                duration={25}
                reducedMotion={reducedMotion}
            />
            <GrainyPlanet
                color="#3b82f6"
                size={300}
                top="60%"
                left="75%"
                delay={5}
                duration={30}
                reducedMotion={reducedMotion}
            />
            <GrainyPlanet
                color="#8b5cf6"
                size={150}
                top="10%"
                left="85%"
                delay={2}
                duration={15}
                reducedMotion={reducedMotion}
            />
            <Comet reducedMotion={reducedMotion} />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
        </div>
    );
};
