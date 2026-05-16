import { motion, AnimatePresence } from "framer-motion";

/**
 * Smooth page-enter wrapper. Wrap a page's top-level container.
 */
export function PageTransition({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered list reveal. Children get a fade+rise effect in sequence.
 * Wrap each child in <Item> below.
 */
export function StaggerList({ children, className = "", delayChildren = 0, stagger = 0.06 }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: stagger, delayChildren },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Item({ children, className = "", as = "div" }) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      variants={{
        hidden: { opacity: 0, y: 14, scale: 0.98 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Smooth tap-able motion button. Drop-in for <button>.
 */
export function MotionButton({ children, className = "", ...props }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * Smooth modal/sheet wrapper using AnimatePresence.
 */
export function Sheet({ open, onClose, children, side = "bottom" }) {
  const initial = side === "bottom" ? { y: "100%" } : side === "right" ? { x: "100%" } : side === "left" ? { x: "-100%" } : { opacity: 0, scale: 0.96 };
  const animate = side === "bottom" || side === "left" || side === "right" ? { x: 0, y: 0 } : { opacity: 1, scale: 1 };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={initial}
            animate={animate}
            exit={initial}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed z-50"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { motion, AnimatePresence };
