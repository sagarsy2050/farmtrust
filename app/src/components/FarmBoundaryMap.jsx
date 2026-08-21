import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Crosshair, Trash2, Check } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function calculatePolygonArea(latlngs) {
  // Shoelace formula for polygon area on a sphere (approximate in m²)
  if (latlngs.length < 3) return 0;
  const R = 6378137;
  let area = 0;
  const points = latlngs.map(p => [p.lat * Math.PI / 180, p.lng * Math.PI / 180]);
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += (points[j][1] - points[i][1]) * (2 + Math.sin(points[i][0]) + Math.sin(points[j][0]));
  }
  area = Math.abs(area * R * R / 2);
  return area / 10000; // hectares
}

function ClickHandler({ onClick }) {
  useMapEvents({ click: e => onClick(e.latlng) });
  return null;
}

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15);
  }, [center]);
  return null;
}

export default function FarmBoundaryMap({ initialBoundary = [], initialCenter, onSave }) {
  const [points, setPoints] = useState(initialBoundary);
  const [center, setCenter] = useState(initialCenter || { lat: 23.0225, lng: 72.5714 }); // Ahmedabad default
  const [satelliteView, setSatelliteView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const savedRef = useRef(false);

  const area = calculatePolygonArea(points);

  const handleMapClick = (latlng) => {
    setPoints(prev => [...prev, latlng]);
    savedRef.current = false;
  };

  const removeLast = () => {
    setPoints(prev => prev.slice(0, -1));
    savedRef.current = false;
  };

  const clearAll = () => {
    setPoints([]);
    savedRef.current = false;
  };

  const useGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await res.json();
      if (data && data[0]) {
        setCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        setSearchError('No location found for that search.');
      }
    } catch (e) {
      console.error(e);
      setSearchError('Location search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSave = () => {
    onSave && onSave({ boundary: points, calculated_area_hectares: area, center_lat: center?.lat, center_lng: center?.lng });
    savedRef.current = true;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
          placeholder="Search village or location..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm sm:flex-1"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={searchLocation} disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={useGPS}>
            <Crosshair className="mr-1 h-4 w-4" /> Use GPS
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setSatelliteView(!satelliteView)}>
            {satelliteView ? 'Map view' : 'Satellite'}
          </Button>
        </div>
      </div>
      {searchError && <p className="text-xs text-destructive">{searchError}</p>}

      <div className="relative overflow-hidden rounded-2xl border border-border">
        <MapContainer
          center={center}
          zoom={15}
          className="h-[280px] w-full sm:h-[400px]"
        >
          <TileLayer
            url={satelliteView
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
            attribution={satelliteView ? 'Imagery © Esri' : '© OpenStreetMap'}
          />
          <ClickHandler onClick={handleMapClick} />
          <Recenter center={center} />
          {points.length > 0 && (
            <Polygon positions={points} pathOptions={{ color: '#15803d', fillColor: '#22c55e', fillOpacity: 0.3 }} />
          )}
          {points.map((p, i) => (
            <Marker key={i} position={p} />
          ))}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Points: {points.length}</span>
          {points.length >= 3 && (
            <span className="font-semibold text-primary">Estimated area: {area.toFixed(2)} hectares</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={removeLast} disabled={points.length === 0}>
            <Trash2 className="mr-1 h-4 w-4" /> Undo point
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={clearAll} disabled={points.length === 0}>
            Clear all
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={points.length < 3}>
            <Check className="mr-1 h-4 w-4" /> Confirm boundary
          </Button>
        </div>
      </div>

      {points.length < 3 && (
        <p className="text-xs text-muted-foreground">
          Click on the map to drop points around your farm. Add at least 3 points to form a boundary.
        </p>
      )}
    </div>
  );
}
