import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const notesData = [
  {
    id: 1,
    title: "Legal Responsibilities",
    icon: "L",
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
    icon: "F",
    content: [
      "F - Fuel: Check you have enough fuel for your journey",
      "L - Lights: Ensure all lights are working (headlights, brake lights, indicators)",
      "O - Oil: Check oil level is between min and max on dipstick",
      "W - Water: Check coolant level and windscreen washer fluid",
      "E - Electrics: Check battery, horn, and all warning lights",
      "R - Rubber: Check tyre pressure, tread depth (min 1.6mm), and condition"
    ]
  },
  {
    id: 3,
    title: "Cockpit Checks",
    icon: "C",
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
    icon: "S",
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
    icon: "I",
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
    icon: "M",
    content: [
      "Moving Away Routine (POM): Prepare - Observe - Move",
      "Prepare: Clutch down, select first gear, set gas, find biting point",
      "Observe: Check mirrors (centre, right), check blind spot",
      "Move: Release handbrake, steer gently away from kerb",
      "Stopping Routine (MSM): Mirror - Signal - Manoeuvre",
      "Check mirrors early, signal if necessary, brake progressively",
      "Secure the car: handbrake on, neutral gear, cancel signal"
    ]
  },
  {
    id: 7,
    title: "Safe Positioning",
    icon: "P",
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
  { label: "Book Driving Test", url: "https://www.gov.uk/book-driving-test", color: "bg-green-500 hover:bg-green-600" },
  { label: "Change Driving Test", url: "https://www.gov.uk/change-driving-test", color: "bg-blue-500 hover:bg-blue-600" },
  { label: "Cancel Driving Test", url: "https://www.gov.uk/cancel-driving-test", color: "bg-orange-500 hover:bg-orange-600" },
  { label: "Highway Code", url: "https://www.gov.uk/guidance/the-highway-code", color: "bg-purple-500 hover:bg-purple-600" }
];

function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <div 
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
        style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
      >
        <button
          onClick={onToggle}
          className="w-full"
          style={{
            width: "100%",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isOpen ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f8fafc",
            color: isOpen ? "white" : "#1e293b",
            border: "none",
            cursor: "pointer",
            transition: "all 0.3s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <motion.span
              animate={{ rotate: isOpen ? 360 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: isOpen ? "rgba(255,255,255,0.2)" : "#667eea",
                color: isOpen ? "white" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "18px"
              }}
            >
              {item.icon}
            </motion.span>
            <span style={{ fontSize: "18px", fontWeight: "600" }}>{item.title}</span>
          </div>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: "24px" }}
          >
            {isOpen ? "−" : "+"}
          </motion.span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <ul style={{ padding: "20px", margin: 0, listStyle: "none" }}>
                {item.content.map((point, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      padding: "12px 16px",
                      marginBottom: "8px",
                      background: "#f1f5f9",
                      borderRadius: "8px",
                      borderLeft: "4px solid #667eea",
                      fontSize: "15px",
                      lineHeight: "1.6"
                    }}
                  >
                    {point}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function ImportantNotes() {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState([1]); // First item open by default

  const toggleItem = (id) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const expandAll = () => setOpenItems(notesData.map(item => item.id));
  const collapseAll = () => setOpenItems([]);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "30px" }}
      >
        <button 
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "#667eea",
            cursor: "pointer",
            fontSize: "16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          ← Back
        </button>

        <h1 style={{ 
          fontSize: "32px", 
          fontWeight: "700", 
          marginBottom: "10px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Important Driving Notes
        </h1>
        <p style={{ color: "#64748b", fontSize: "16px" }}>
          Essential knowledge for your driving journey. Click each section to expand.
        </p>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={expandAll}
            style={{
              padding: "10px 20px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            style={{
              padding: "10px 20px",
              background: "#e2e8f0",
              color: "#475569",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            Collapse All
          </button>
        </div>
      </motion.div>

      {/* Notes Accordion */}
      <div style={{ marginBottom: "40px" }}>
        {notesData.map((item, index) => (
          <AccordionItem
            key={item.id}
            item={item}
            isOpen={openItems.includes(item.id)}
            onToggle={() => toggleItem(item.id)}
          />
        ))}
      </div>

      {/* Nano Banana Animation Placeholder */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: "16px",
          padding: "30px",
          textAlign: "center",
          marginBottom: "40px",
          border: "2px dashed #f59e0b"
        }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{ fontSize: "48px", marginBottom: "10px" }}
        >
          🍌
        </motion.div>
        <p style={{ color: "#92400e", fontWeight: "600", marginBottom: "5px" }}>
          Nano Banana Animation Zone
        </p>
        <p style={{ color: "#b45309", fontSize: "14px" }}>
          Future animations coming soon!
        </p>
      </motion.div>

      {/* Ready to Pass Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ 
          fontSize: "24px", 
          fontWeight: "700", 
          marginBottom: "10px",
          textAlign: "center"
        }}>
          Ready to Pass? 🎉
        </h2>
        <p style={{ 
          color: "#64748b", 
          textAlign: "center",
          marginBottom: "25px"
        }}>
          Access official DVLA services below
        </p>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "15px" 
        }}>
          {dvlaLinks.map((link, index) => (
            <motion.a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px 24px",
                borderRadius: "12px",
                color: "white",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "15px",
                background: link.color.includes("green") ? "#22c55e" :
                           link.color.includes("blue") ? "#3b82f6" :
                           link.color.includes("orange") ? "#f97316" : "#a855f7",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                transition: "all 0.3s ease"
              }}
            >
              {link.label} →
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* Footer tip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ 
          textAlign: "center", 
          color: "#94a3b8", 
          marginTop: "30px",
          fontSize: "14px"
        }}
      >
        Good luck with your driving journey! 🚗
      </motion.p>
    </div>
  );
}
