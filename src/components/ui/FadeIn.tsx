"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right";

interface FadeInProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}

function getInitial(direction: Direction, distance: number) {
  switch (direction) {
    case "up":    return { opacity: 0, y: distance };
    case "down":  return { opacity: 0, y: -distance };
    case "left":  return { opacity: 0, x: distance };
    case "right": return { opacity: 0, x: -distance };
  }
}

export default function FadeIn({
  children,
  direction = "up",
  delay = 0,
  distance = 24,
  className,
  once = true,
}: FadeInProps) {
  const variants: Variants = {
    hidden: getInitial(direction, distance),
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 60,
        damping: 20,
        delay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
