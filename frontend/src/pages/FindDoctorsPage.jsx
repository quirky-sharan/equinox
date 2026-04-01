import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope, Phone, MapPin, IndianRupee, Star, Filter,
  Search, Building2, Clock, ChevronDown, AlertTriangle, X, User
} from "lucide-react";

const SPECIALTIES = [
  "All Specialties",
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Orthopedic",
  "Pediatrician",
  "Gynecologist",
  "ENT Specialist",
  "Neurologist",
  "Dentist",
  "Ophthalmologist",
  "Psychiatrist",
  "Pulmonologist",
];

const SORT_OPTIONS = [
  { value: "distance", label: "Distance (Nearest)" },
  { value: "price_low", label: "Price (Low → High)" },
  { value: "price_high", label: "Price (High → Low)" },
  { value: "rating", label: "Rating (Highest)" },
  { value: "experience", label: "Experience (Most)" },
];

const DOCTORS_BASE = [
  { id: 1, name: "Dr. Aarav Sharma", specialty: "General Physician", hospital: "Apollo Hospitals", address: "Greams Lane, Chennai", distance: 0.8, fee: 500, rating: 4.8, experience: 15, available: "Mon-Sat, 9AM-5PM", languages: ["Hindi", "English", "Tamil"] },
  { id: 2, name: "Dr. Priya Patel", specialty: "Cardiologist", hospital: "Fortis Hospital", address: "Bannerghatta Road, Bangalore", distance: 1.2, fee: 1200, rating: 4.9, experience: 22, available: "Mon-Fri, 10AM-4PM", languages: ["Hindi", "English", "Gujarati"] },
  { id: 3, name: "Dr. Rohan Mehta", specialty: "Dermatologist", hospital: "Max Super Speciality", address: "Saket, New Delhi", distance: 1.5, fee: 800, rating: 4.6, experience: 10, available: "Mon-Sat, 11AM-7PM", languages: ["Hindi", "English"] },
  { id: 4, name: "Dr. Sneha Iyer", specialty: "Gynecologist", hospital: "Manipal Hospital", address: "Old Airport Road, Bangalore", distance: 2.0, fee: 1000, rating: 4.7, experience: 18, available: "Tue-Sat, 9AM-3PM", languages: ["Hindi", "English", "Kannada"] },
  { id: 5, name: "Dr. Vikram Singh", specialty: "Orthopedic", hospital: "AIIMS", address: "Ansari Nagar, New Delhi", distance: 2.3, fee: 600, rating: 4.5, experience: 20, available: "Mon-Fri, 8AM-2PM", languages: ["Hindi", "English", "Punjabi"] },
  { id: 6, name: "Dr. Kavitha Reddy", specialty: "Pediatrician", hospital: "Rainbow Children's Hospital", address: "Banjara Hills, Hyderabad", distance: 2.8, fee: 700, rating: 4.8, experience: 14, available: "Mon-Sat, 9AM-6PM", languages: ["Hindi", "English", "Telugu"] },
  { id: 7, name: "Dr. Arjun Nair", specialty: "ENT Specialist", hospital: "Amrita Hospital", address: "Ponekkara, Kochi", distance: 3.1, fee: 650, rating: 4.4, experience: 12, available: "Mon-Fri, 10AM-5PM", languages: ["Hindi", "English", "Malayalam"] },
  { id: 8, name: "Dr. Meera Joshi", specialty: "Neurologist", hospital: "Kokilaben Hospital", address: "Andheri West, Mumbai", distance: 3.5, fee: 1500, rating: 4.9, experience: 25, available: "Mon-Thu, 10AM-4PM", languages: ["Hindi", "English", "Marathi"] },
  { id: 9, name: "Dr. Rajesh Kumar", specialty: "Dentist", hospital: "Clove Dental", address: "Connaught Place, New Delhi", distance: 1.0, fee: 400, rating: 4.3, experience: 8, available: "Mon-Sat, 9AM-8PM", languages: ["Hindi", "English"] },
  { id: 10, name: "Dr. Ananya Ghosh", specialty: "Ophthalmologist", hospital: "Sankara Nethralaya", address: "Nungambakkam, Chennai", distance: 4.0, fee: 900, rating: 4.7, experience: 16, available: "Mon-Fri, 9AM-5PM", languages: ["Hindi", "English", "Bengali"] },
  { id: 11, name: "Dr. Siddharth Desai", specialty: "Psychiatrist", hospital: "NIMHANS", address: "Hosur Road, Bangalore", distance: 4.5, fee: 1100, rating: 4.6, experience: 19, available: "Mon-Fri, 11AM-6PM", languages: ["Hindi", "English", "Gujarati"] },
  { id: 12, name: "Dr. Pooja Agarwal", specialty: "Pulmonologist", hospital: "Medanta Hospital", address: "Sector 38, Gurugram", distance: 5.0, fee: 1300, rating: 4.8, experience: 17, available: "Mon-Sat, 10AM-4PM", languages: ["Hindi", "English"] },
  { id: 13, name: "Dr. Karan Malhotra", specialty: "General Physician", hospital: "Sir Ganga Ram Hospital", address: "Rajinder Nagar, New Delhi", distance: 1.8, fee: 550, rating: 4.5, experience: 11, available: "Mon-Sat, 8AM-4PM", languages: ["Hindi", "English", "Punjabi"] },
  { id: 14, name: "Dr. Lakshmi Venkatesh", specialty: "Cardiologist", hospital: "Narayana Health", address: "Bommasandra, Bangalore", distance: 5.5, fee: 1400, rating: 4.9, experience: 28, available: "Mon-Wed-Fri, 9AM-1PM", languages: ["Hindi", "English", "Tamil", "Kannada"] },
  { id: 15, name: "Dr. Neeraj Gupta", specialty: "Dermatologist", hospital: "Skin & You Clinic", address: "Juhu, Mumbai", distance: 2.5, fee: 950, rating: 4.4, experience: 9, available: "Tue-Sat, 11AM-7PM", languages: ["Hindi", "English", "Marathi"] },
  { id: 16, name: "Dr. Deepa Krishnan", specialty: "Gynecologist", hospital: "Cloudnine Hospital", address: "Jayanagar, Bangalore", distance: 3.3, fee: 1100, rating: 4.8, experience: 21, available: "Mon-Sat, 10AM-5PM", languages: ["Hindi", "English", "Malayalam", "Kannada"] },
  { id: 17, name: "Dr. Aditya Bhatt", specialty: "Orthopedic", hospital: "Hinduja Hospital", address: "Mahim, Mumbai", distance: 3.8, fee: 850, rating: 4.6, experience: 13, available: "Mon-Fri, 9AM-3PM", languages: ["Hindi", "English", "Gujarati"] },
  { id: 18, name: "Dr. Ishita Sen", specialty: "Pediatrician", hospital: "Wockhardt Hospital", address: "Mira Road, Mumbai", distance: 6.0, fee: 600, rating: 4.5, experience: 10, available: "Mon-Sat, 9AM-5PM", languages: ["Hindi", "English", "Bengali"] },
  { id: 19, name: "Dr. Manish Tiwari", specialty: "ENT Specialist", hospital: "Safdarjung Hospital", address: "Ring Road, New Delhi", distance: 2.0, fee: 500, rating: 4.3, experience: 15, available: "Mon-Sat, 8AM-2PM", languages: ["Hindi", "English"] },
  { id: 20, name: "Dr. Ritu Saxena", specialty: "Neurologist", hospital: "BLK Hospital", address: "Pusa Road, New Delhi", distance: 4.2, fee: 1600, rating: 4.7, experience: 23, available: "Mon-Thu, 9AM-3PM", languages: ["Hindi", "English"] },
];

const PHONE = "+91 7990588077";

const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under ₹500", min: 0, max: 499 },
  { label: "₹500 – ₹1000", min: 500, max: 1000 },
  { label: "₹1000 – ₹1500", min: 1000, max: 1500 },
  { label: "Above ₹1500", min: 1500, max: Infinity },
];

const DISTANCE_RANGES = [
  { label: "Any Distance", max: Infinity },
  { label: "Within 1 km", max: 1 },
  { label: "Within 3 km", max: 3 },
  { label: "Within 5 km", max: 5 },
];

export default function FindDoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [specialty, setSpecialty] = useState("All Specialties");
  const [priceRange, setPriceRange] = useState(0);
  const [distanceRange, setDistanceRange] = useState(0);
  const [sortBy, setSortBy] = useState("distance");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [doctorsWithCoords, setDoctorsWithCoords] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);
  const [markersLayer, setMarkersLayer] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  
  const mapRef = useRef(null);

  // Initialize Map & Generate Fake Coordinates
  useEffect(() => {
    let script, link;
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

    if (!apiKey) {
      setMapError("Geoapify API Key is missing. Please add VITE_GEOAPIFY_API_KEY to frontend/.env");
      return;
    }

    const generateCoordinates = (lat, lng) => {
      // Create random coordinates for each doctor based on their distance property
      const mapped = DOCTORS_BASE.map((doc, idx) => {
        // pseudo-random angle based on index so it's stable during re-renders
        const angle = (idx * 0.5) * Math.PI * 2; 
        const latOffset = (doc.distance / 111) * Math.cos(angle);
        const lngOffset = (doc.distance / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
        
        return {
          ...doc,
          lat: lat + latOffset,
          lng: lng + lngOffset
        };
      });
      setDoctorsWithCoords(mapped);
      return mapped;
    };

    const initMapAndFetch = async (lat, lng) => {
      if (!mapRef.current || mapInstance) return;
      setUserLocation({ lat, lng });

      // Initialize Leaflet Map
      const L = window.L;
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([lat, lng], 13);

      // Add Geoapify Dark Matter Tiles
      L.tileLayer(`https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=${apiKey}`, {
        maxZoom: 20,
      }).addTo(map);

      // Custom User Marker
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="width: 16px; height: 16px; background-color: #0ea5e9; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(14,165,233,0.8);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup("Your Location");

      // Layer group for doctor markers so we can clear/update them
      const layerGroup = L.layerGroup().addTo(map);
      setMarkersLayer(layerGroup);
      setMapInstance(map);

      generateCoordinates(lat, lng);
    };

    const loadLeaflet = () => {
      if (window.L) {
        getLocationAndInit();
        return;
      }

      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = getLocationAndInit;
      script.onerror = () => setMapError("Failed to load map engine.");
      document.head.appendChild(script);
    };

    const getLocationAndInit = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => initMapAndFetch(position.coords.latitude, position.coords.longitude),
          () => {
            console.warn("Geolocation denied. Defaulting location.");
            initMapAndFetch(28.6139, 77.2090); // Default to New Delhi
          }
        );
      } else {
        initMapAndFetch(28.6139, 77.2090);
      }
    };

    loadLeaflet();

    return () => {
      if (script && document.head.contains(script)) document.head.removeChild(script);
      if (link && document.head.contains(link)) document.head.removeChild(link);
    };
  }, []);

  const filteredDoctors = useMemo(() => {
    let result = [...doctorsWithCoords];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.hospital.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.address.toLowerCase().includes(q)
      );
    }

    if (specialty !== "All Specialties") {
      result = result.filter((d) => d.specialty === specialty);
    }

    const pr = PRICE_RANGES[priceRange];
    result = result.filter((d) => d.fee >= pr.min && d.fee <= pr.max);

    const dr = DISTANCE_RANGES[distanceRange];
    result = result.filter((d) => d.distance <= dr.max);

    switch (sortBy) {
      case "distance":
        result.sort((a, b) => a.distance - b.distance);
        break;
      case "price_low":
        result.sort((a, b) => a.fee - b.fee);
        break;
      case "price_high":
        result.sort((a, b) => b.fee - a.fee);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "experience":
        result.sort((a, b) => b.experience - a.experience);
        break;
    }

    return result;
  }, [doctorsWithCoords, searchQuery, specialty, priceRange, distanceRange, sortBy]);

  // Update Map Markers when filtered list changes
  useEffect(() => {
    if (!mapInstance || !window.L || !markersLayer) return;

    markersLayer.clearLayers();

    const hospitalIcon = window.L.divIcon({
      className: 'custom-hospital-marker',
      html: `<div style="width: 20px; height: 20px; background-color: #f43f5e; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(244,63,94,0.4); display: flex; align-items: center; justify-content: center; color: white;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const activeIcon = window.L.divIcon({
        className: 'custom-hospital-marker-active',
        html: `<div style="width: 24px; height: 24px; background-color: #0ea5e9; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 20px rgba(14,165,233,0.8); z-index: 1000;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

    filteredDoctors.forEach(doc => {
      const isSelected = selectedDoctor?.id === doc.id;
      const marker = window.L.marker([doc.lat, doc.lng], { 
          icon: isSelected ? activeIcon : hospitalIcon,
          zIndexOffset: isSelected ? 1000 : 0
      }).addTo(markersLayer);
      
      marker.bindTooltip(`<b>${doc.name}</b><br/>${doc.specialty}`, {
          direction: 'top',
          offset: [0, -10],
          className: 'custom-tooltip'
      });

      marker.on('click', () => {
        setSelectedDoctor(doc);
        mapInstance.flyTo([doc.lat, doc.lng], 15, { duration: 1 });
      });
    });

  }, [filteredDoctors, mapInstance, markersLayer, selectedDoctor]);

  const getRatingColor = (rating) => {
    if (rating >= 4.7) return "var(--risk-low)";
    if (rating >= 4.4) return "var(--accent-blue)";
    return "var(--risk-medium)";
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)", width: "100%", overflow: "hidden", position: "relative" }}>
        
      {/* Sidebar List area */}
      <div style={{ width: "45%", minWidth: 400, maxWidth: 500, background: "var(--bg-base)", display: "flex", flexDirection: "column", borderRight: "1px solid var(--border-color)", zIndex: 10 }}>
        
        {/* Header & Controls Content */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem",
                display: "flex", alignItems: "flex-start", gap: 10,
                }}
            >
                <AlertTriangle size={16} color="var(--risk-medium)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>
                    <strong style={{ color: "var(--risk-medium)" }}>Example Data:</strong> Not real doctors. Demo only.
                </p>
            </motion.div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.2rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(14,165,233,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MapPin size={20} color="var(--accent-blue)" />
                </div>
                <div>
                    <h1 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Local Specialists</h1>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>{filteredDoctors.length} providers found</p>
                </div>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                    type="text" placeholder="Search by name, hospital, specialty..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 40, paddingRight: 40, borderRadius: "var(--radius-full)" }}
                />
            </div>

            <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                    background: showFilters ? "var(--bg-card-hover)" : "var(--bg-subtle)", border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-full)", padding: "6px 14px",
                    display: "flex", alignItems: "center", gap: 6,
                    color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s",
                }}
            >
                <Filter size={12} /> {showFilters ? "Hide Filters" : "Filters & Sorting"}
                <ChevronDown size={12} style={{ transform: showFilters ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }} />
            </button>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: "hidden" }}
                    >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", paddingTop: "1rem" }}>
                            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="form-input" style={{ fontSize: "0.8rem", padding: "8px" }}>
                                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-input" style={{ fontSize: "0.8rem", padding: "8px" }}>
                                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <select value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} className="form-input" style={{ fontSize: "0.8rem", padding: "8px" }}>
                                {PRICE_RANGES.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
                            </select>
                            <select value={distanceRange} onChange={(e) => setDistanceRange(Number(e.target.value))} className="form-input" style={{ fontSize: "0.8rem", padding: "8px" }}>
                                {DISTANCE_RANGES.map((d, i) => <option key={i} value={i}>{d.label}</option>)}
                            </select>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Doctor List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredDoctors.length === 0 ? (
                <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <AlertTriangle size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
                    <p>No providers match your criteria.</p>
                </div>
            ) : (
                filteredDoctors.map((doctor, i) => (
                    <motion.div
                        key={doctor.id}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                        onClick={() => {
                            setSelectedDoctor(doctor);
                            if (mapInstance) mapInstance.flyTo([doctor.lat, doctor.lng], 16, { duration: 1 });
                        }}
                        style={{
                            padding: "1.25rem", borderRadius: "var(--radius-md)",
                            background: selectedDoctor?.id === doctor.id ? "var(--bg-subtle)" : "var(--bg-card)",
                            border: "1px solid", borderColor: selectedDoctor?.id === doctor.id ? "var(--accent-blue)" : "var(--border-color)",
                            cursor: "pointer", transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => { if(selectedDoctor?.id !== doctor.id) e.currentTarget.style.borderColor = "var(--text-muted)"; }}
                        onMouseLeave={(e) => { if(selectedDoctor?.id !== doctor.id) e.currentTarget.style.borderColor = "var(--border-color)"; }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                                <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>{doctor.name}</h3>
                                <p style={{ fontSize: "0.8rem", color: "var(--accent-blue)", fontWeight: 600, margin: "2px 0 0 0" }}>{doctor.specialty}</p>
                            </div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text-primary)" }}>
                                ₹{doctor.fee}
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--text-secondary)" }}>
                            <Building2 size={12} /> <span style={{ fontSize: "0.8rem" }}>{doctor.hospital}</span>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {doctor.distance} km</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={12} fill={getRatingColor(doctor.rating)} color={getRatingColor(doctor.rating)} /> {doctor.rating}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {doctor.experience} yrs exp</div>
                        </div>
                    </motion.div>
                ))
            )}
        </div>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: "relative", background: "#09090b" }}>
        {mapError && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--risk-critical)", background: "rgba(0,0,0,0.8)", zIndex: 1000, padding: 20, textAlign: "center" }}>
                {mapError}
            </div>
        )}
        <div ref={mapRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />

        {/* Selected Doctor Floating Card Overlay */}
        <AnimatePresence>
            {selectedDoctor && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                    style={{
                        position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
                        width: "90%", maxWidth: 450, zIndex: 1000,
                        background: "rgba(9, 9, 11, 0.9)", backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-lg)",
                        padding: "1.5rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
                    }}
                >
                    <button onClick={() => setSelectedDoctor(null)} style={{ position: "absolute", top: 12, right: 12, background: "transparent", border: "none", color: "gray", cursor: "pointer" }}><X size={18} /></button>
                    
                    <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                        <div style={{ width: 50, height: 50, borderRadius: 12, background: "var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                            <User size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "white" }}>{selectedDoctor.name}</h2>
                            <p style={{ fontSize: "0.85rem", color: "#38bdf8", margin: 0 }}>{selectedDoctor.specialty} • {selectedDoctor.hospital}</p>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1.5rem" }}>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            <Clock size={12} style={{ display: "inline", marginRight: 4 }} /> {selectedDoctor.available}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            <IndianRupee size={12} style={{ display: "inline", marginRight: 4 }} /> {selectedDoctor.fee} per visit
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            <MapPin size={12} style={{ display: "inline", marginRight: 4 }} /> {selectedDoctor.address}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            <User size={12} style={{ display: "inline", marginRight: 4 }} /> {selectedDoctor.languages.join(", ")}
                        </div>
                    </div>

                    <a
                        href={`tel:${PHONE.replace(/\s/g, "")}`}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "10px", borderRadius: "100px",
                            background: "white", color: "black",
                            fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                            width: "100%"
                        }}
                    >
                        <Phone size={16} /> Contact {PHONE}
                    </a>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

    </div>
  );
}
