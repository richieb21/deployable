"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

// Component to animate numbers
export const AnimatedNumber = ({ value }: { value: number }) => {
  const spring = useSpring(value, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
  });
  const display = useTransform(spring, (currentValue) =>
    Math.round(currentValue)
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};
