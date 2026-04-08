import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./ImportantNotes.css";

const notesData = [
  {
    id: 1,
    title: "Legal Responsibilities",
    icon: "⚖️",
    accent: "#f59e0b",
    content: [
      "You must hold a valid provisional or full driving licence",
      "Your vehicle must be taxed, insured, and have a valid MOT (if over 3 years old)",
      "You must display L plates (or D plates in Wales) when learning",
      "You cannot drive on motorways with a provisional licence (unless with an approved instructor in a dual-control car)",
      "You must report any medical conditions that could affect your driving to the DVLA",
      "You are responsible for ensuring your vehicle is roadworthy before every journey"
    ]
  },
  {
    id: 2,
    title: "Safety Checks (FLOWER)",
    icon: "🌸",
    accent: "#10b981",
    content: [
      "F — Fuel: Check you have enough fuel for your journey",
      "L — Lights: Ensure all lights are working (headlights, brake lights, indicators)",
      "O — Oil: Check oil level is between min and max on dipstick",
      "W — Water: Check coolant level and windscreen washer fluid",
      "E — Electrics: Check battery, horn, and all warning lights",
      "R — Rubber: Check tyre pressure, tread depth (min 1.6mm), and condition"
    ]
  },
  {
    id: 3,
    title: "Cockpit Checks",
    icon: "🪑",
    accent: "#3b82f6",
    content: [
      "Adjust your seat so you can reach all controls comfortably",
      "Adjust head restraint to the middle of your head",
      "Adjust mirrors: interior mirror first, then door mirrors",
      "Ensure doors are properly closed",
      "Fasten seatbelt and ensure all passengers have done the same",
      "Check handbrake is on and gear is in neutral (or Park for automatic)"
    ]
  },
  {
    id: 4,
    title: "Security",
    icon: "🔒",
    accent: "#8b5cf6",
    content: [
      "Always lock your vehicle when leaving it unattended",
      "Never leave valuables visible inside the car",
      "Park in well-lit areas when possible",
      "Use steering wheel locks or other security devices",
      "Keep your keys safe and never leave them in the ignition",
      "Be aware of your surroundings when getting in or out of your vehicle"
    ]
  },
  {
    id: 5,
    title: "Controls and Instruments",
    icon: "🎛️",
    accent: "#ef4444",
    content: [
      "Steering wheel: Use the 'pull-push' method for smooth control",
      "Accelerator: Press gently for smooth acceleration",
      "Brake: Apply progressively, not suddenly",
      "Clutch: Use smoothly to prevent stalling (manual only)",
      "Gears: Match gear to speed and road conditions",
      "Handbrake: Use when stationary to secure the vehicle",
      "Indicators: Signal in good time before any manoeuvre",
      "Dashboard: Know your warning lights and what they mean"
    ]
  },
  {
    id: 6,
    title: "Moving Away and Stopping",
    icon: "🚗",
    accent: "#06b6d4",
    content: [
      "Moving Away Routine (POM): Prepare — Observe — Move",
      "Prepare: Clutch down, select first gear, set gas, find biting point",
      "Observe: Check mirrors (centre, right), check blind spot",
      "Move: Release handbrake, steer gently away from kerb",
      "Stopping Routine (MSM): Mirror — Signal — Manoeuvre",
      "Check mirrors early, signal if necessary, brake progressively",
      "Secure the car: handbrake on, neutral gear, cancel signal"
    ]
  },
  {
    id: 7,
    title: "Safe Positioning",
    icon: "🛣️",
    accent: "#f97316",
    content: [
      "Normal driving: Keep to the left unless overtaking",
      "One-way streets: Position in the correct lane early",
      "Roundabouts: Left lane for left/straight, right lane for right",
      "Turning left: Position close to the left kerb",
      "Turning right: Position just left of centre of the road",
      "Pedestrian crossings: Stop before the white line",
      "Junctions: Position according to the road markings"
    ]
  }
];

const dvlaLinks = [
  { label: "Book Driving Test", url: "https://www.gov.uk/book-driving-test", color: "#22c55e" },
  { label: "Change Driving Test", url: "https://www.gov.uk/change-driving-test", color: "#3b82f6" },
  { label: "Cancel Driving Test", url: "https://www.gov.uk/cancel-driving-test", color: "#f97316" },
  { label: "Highway Code", url: "https://www.gov.uk/guidance/the-highway-code", color: "#a855f7" }
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: "easeOut" } }
};

function AccordionItem({ item, isOpen, onToggle, index }) {
  return (
    <motion.div variants={itemVariants} className="note-accordion">
      <button
        className={`note-accordion-header ${isOpen ? "open" : ""}`}
        onClick={onToggle}
        style={{ "--accent": item.accent }}
      >
        <div className="note-accordion-left">
          <span className="note-icon" style={{ background: `${item.accent}22`, color: item.accent }}>
            {item.icon}
          </span>
          <span className="note-title">{item.title}</span>
        </div>
        <motion.span
          className="note-chevron"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <motion.ul
              className="note-list"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {item.content.map((point, i) => (
                <motion.li
                  key={i}
                  variants={listItemVariants}
                  className="note-list-item"
                  style={{ "--accent": item.accent }}
                >
                  {point}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ImportantNotes() {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState([1]);

  const toggleItem = (id) => {
    setOpenItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="notes-page">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="notes-header"
      >
        <button className="notes-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h1 className="notes-heading">Important Driving Notes</h1>
          <p className="notes-sub">Essential knowledge for your driving journey. Click each section to expand.</p>
        </div>
        <div className="notes-actions">
          <button className="notes-expand-btn" onClick={() => setOpenItems(notesData.map(i => i.id))}>
            Expand All
          </button>
          <button className="notes-collapse-btn" onClick={() => setOpenItems([])}>
            Collapse All
          </button>
        </div>
      </motion.div>

      <motion.div
        className="notes-accordion-list"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {notesData.map((item, index) => (
          <AccordionItem
            key={item.id}
            item={item}
            index={index}
            isOpen={openItems.includes(item.id)}
            onToggle={() => toggleItem(item.id)}
          />
        ))}
      </motion.div>

      <motion.div
        className="notes-dvla-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="notes-dvla-title">Ready to Pass? 🎉</h2>
        <p className="notes-dvla-sub">Access official DVLA services below</p>
        <div className="notes-dvla-grid">
          {dvlaLinks.map((link, i) => (
            <motion.a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="notes-dvla-link"
              style={{ background: link.color }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.07 }}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              {link.label} →
            </motion.a>
          ))}
        </div>
      </motion.div>

      <motion.p
        className="notes-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Good luck with your driving journey! 🚗
      </motion.p>
    </div>
  );
}
