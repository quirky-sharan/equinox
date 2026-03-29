import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Star } from "lucide-react";

export default function DoctorMapModal({ onClose }) {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [places, setPlaces] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    let script, link;
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

    if (!apiKey) {
      setError("Geoapify API Key is missing. Please add VITE_GEOAPIFY_API_KEY to frontend/.env");
      setLoading(false);
      return;
    }

    const initMapAndFetch = async (lat, lng) => {
      if (!mapRef.current) return;

      // Initialize Leaflet Map
      const L = window.L;
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([lat, lng], 14);

      // Add Geoapify Dark Matter Tiles
      L.tileLayer(`https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=${apiKey}`, {
        maxZoom: 20,
      }).addTo(map);

      // Custom User Marker Icon (Blue pulse)
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="width: 16px; height: 16px; background-color: #0ea5e9; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(14,165,233,0.8);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Custom Hospital Icon (Dark theme pin)
      const hospitalIcon = L.divIcon({
        className: 'custom-hospital-marker',
        html: `<div style="width: 20px; height: 20px; background-color: #f43f5e; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(244,63,94,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Add User Location Marker
      L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup("Your Location");

      setMapInstance(map);

      // Fetch nearby hospitals from Geoapify Places API
      try {
        const response = await fetch(`https://api.geoapify.com/v2/places?categories=healthcare.hospital,healthcare.clinic_or_practicioner&filter=circle:${lng},${lat},5000&limit=15&apiKey=${apiKey}`);
        if (!response.ok) throw new Error("Failed to fetch places from Geoapify");
        
        const data = await response.json();
        
        if (data && data.features) {
          const fetchedPlaces = data.features.map(f => ({
            id: f.properties.place_id,
            name: f.properties.name || "Unknown Facility",
            address: f.properties.address_line2 || f.properties.formatted,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            distance: f.properties.distance,
          })).filter(p => p.name !== "Unknown Facility");

          setPlaces(fetchedPlaces);

          // Add markers for all fetched places
          fetchedPlaces.forEach(place => {
            const marker = L.marker([place.lat, place.lng], { icon: hospitalIcon }).addTo(map);
            marker.bindPopup(`<b>${place.name}</b><br/>${place.address}`);
          });
        }
      } catch (err) {
        console.error(err);
        setError("Could not retrieve hospital locations.");
      } finally {
        setLoading(false);
      }
    };

    const loadLeaflet = () => {
      if (window.L) {
        getLocationAndInit();
        return;
      }

      // Load Leaflet CSS
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      // Load Leaflet JS
      script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = getLocationAndInit;
      script.onerror = () => {
        setError("Failed to load map engine.");
        setLoading(false);
      };
      document.head.appendChild(script);
    };

    const getLocationAndInit = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => initMapAndFetch(position.coords.latitude, position.coords.longitude),
          () => {
            // Default to a central location (e.g., Manhatten, NYC) if denied
            console.warn("Geolocation denied. Defaulting location.");
            initMapAndFetch(40.7128, -74.0060);
          }
        );
      } else {
        initMapAndFetch(40.7128, -74.0060);
      }
    };

    loadLeaflet();

    return () => {
      // Cleanup Leaflet elements
      if (script) document.head.removeChild(script);
      if (link) document.head.removeChild(link);
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ position: "relative", width: "100%", maxWidth: 1000, height: "80vh", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 2rem", borderBottom: "1px solid var(--border-color)", background: "var(--bg-base)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(14,165,233,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MapPin size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>Nearest Clinical Providers</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>Locating hospitals and clinics within 5km (Powered by Geoapify)</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "50%", transition: "background 0.2s" }} className="hover-bg-subtle">
            <X size={24} />
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          
          {/* List Sidebar */}
          <div style={{ width: "35%", minWidth: 300, background: "var(--bg-base)", borderRight: "1px solid var(--border-color)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {loading ? (
              <div style={{ padding: "2rem", display: "flex", alignItems: "center", gap: 12, color: "var(--text-muted)" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 16, height: 16, border: "2px solid var(--text-muted)", borderTopColor: "transparent", borderRadius: "50%" }} />
                <span>Locating signals...</span>
              </div>
            ) : error ? (
              <div style={{ padding: "2rem", color: "var(--risk-critical)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                {error}
              </div>
            ) : places.length === 0 ? (
              <div style={{ padding: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>No facilities found nearby.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {places.map((place, i) => (
                  <motion.div 
                    key={place.id} 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", transition: "background 0.2s", cursor: "pointer" }}
                    onClick={() => {
                        if(mapInstance) {
                            mapInstance.flyTo([place.lat, place.lng], 16, { duration: 1 });
                        }
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{place.name}</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6, lineHeight: 1.4 }}>{place.address}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--accent-blue)", fontWeight: 700 }}>
                        {place.distance ? `${(place.distance / 1000).toFixed(1)} km away` : ''}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Leaflet Map Target */}
          <div style={{ flex: 1, position: "relative", background: "#09090b" }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />
          </div>

        </div>
      </motion.div>
    </div>
  );
}
