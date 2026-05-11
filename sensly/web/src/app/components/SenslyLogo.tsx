import { motion } from 'motion/react';

interface SenslyLogoProps {
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  className?: string;
}

export function SenslyLogo({ size = 'medium', animated = true, className = '' }: SenslyLogoProps) {
  const sizes = {
    small: { fontSize: '28px', height: 40 },
    medium: { fontSize: '52px', height: 70 },
    large: { fontSize: '80px', height: 100 },
  };

  const { fontSize, height } = sizes[size];
  const letters = "Sensly".split('');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 10,
        stiffness: 100,
      },
    },
  };

  const floatingAnimation = animated ? {
    y: [-3, 3, -3],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} style={{ height }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex"
      >
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            variants={letterVariants}
            animate={animated ? {
              y: [-2, 2, -2],
              transition: {
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15
              }
            } : {}}
            style={{
              fontSize,
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 600,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #2A6B76 0%, #4FB3BF 50%, #7DCDD6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 10px rgba(79, 179, 191, 0.3)',
              display: 'inline-block'
            }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
