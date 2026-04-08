import React, { useEffect, useState } from "react";
import { getCarDetails, saveCarDetails } from "../firebase";
import { useToast } from "../context/ToastContext";
import "./CarDetails.css";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ label, dateStr }) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  const variant = days < 0 ? "expired" : days <= 30 ? "warn" : "ok";
  const text =
    days < 0 ? `${label} EXPIRED` :
    days <= 30 ? `${label} expires in ${days} days` :
    `${label} OK`;
  return <span className={`car-expiry-badge car-expiry-badge--${variant}`}>{text}</span>;
}

export default function CarDetails() {
  const { showToast } = useToast();
  const [car, setCar] = useState({
    make: "", model: "", year: "", registration: "", colour: "",
    fuelType: "petrol", insuranceExpiry: "", motExpiry: "", mileage: "", notes: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCarDetails();
        if (data) setCar(data);
        else setEditing(true);
      } catch {
        showToast("Failed to load car details", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCarDetails(car);
      showToast("Car details saved!", "success");
      setEditing(false);
    } catch {
      showToast("Failed to save car details", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="car-page"><p>Loading...</p></div>;

  return (
    <div className="car-page">
      <div className="car-header">
        <h1>My Car</h1>
        {!editing && (
          <button onClick={() => setEditing(true)}>Edit Details</button>
        )}
      </div>

      {!editing && (car.insuranceExpiry || car.motExpiry) && (
        <div className="car-expiry-row">
          <ExpiryBadge label="Insurance" dateStr={car.insuranceExpiry} />
          <ExpiryBadge label="MOT" dateStr={car.motExpiry} />
        </div>
      )}

      {!editing ? (
        <div className="car-view-card">
          {car.make && (
            <div className="car-make-title">
              {car.year} {car.make} {car.model}
            </div>
          )}
          {[
            ["Registration", car.registration],
            ["Colour", car.colour],
            ["Fuel Type", car.fuelType],
            ["Insurance Expiry", car.insuranceExpiry],
            ["MOT Expiry", car.motExpiry],
            ["Mileage", car.mileage ? `${Number(car.mileage).toLocaleString()} miles` : ""],
            ["Notes", car.notes]
          ].map(([label, value]) => value ? (
            <div key={label} className="car-detail-row">
              <span className="car-detail-label">{label}</span>
              <span className="car-detail-value">{value}</span>
            </div>
          ) : null)}
          {!car.make && <p className="car-empty-note">No car details saved yet. Click Edit to add your car.</p>}
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="car-form-grid">
            <div className="car-field">
              <label>Car Make</label>
              <input placeholder="e.g. Ford" value={car.make} onChange={e => setCar({ ...car, make: e.target.value })} />
            </div>
            <div className="car-field">
              <label>Model</label>
              <input placeholder="e.g. Fiesta" value={car.model} onChange={e => setCar({ ...car, model: e.target.value })} />
            </div>
            <div className="car-field">
              <label>Year</label>
              <input placeholder="e.g. 2020" value={car.year} onChange={e => setCar({ ...car, year: e.target.value })} />
            </div>
            <div className="car-field">
              <label>Registration</label>
              <input placeholder="e.g. AB21 XYZ" value={car.registration} onChange={e => setCar({ ...car, registration: e.target.value })} />
            </div>
            <div className="car-field">
              <label>Colour</label>
              <input placeholder="e.g. Silver" value={car.colour} onChange={e => setCar({ ...car, colour: e.target.value })} />
            </div>
            <div className="car-field">
              <label>Fuel Type</label>
              <select value={car.fuelType} onChange={e => setCar({ ...car, fuelType: e.target.value })}>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div className="car-field">
              <label>Insurance Expiry</label>
              <input type="date" value={car.insuranceExpiry} onChange={e => setCar({ ...car, insuranceExpiry: e.target.value })} />
            </div>
            <div className="car-field">
              <label>MOT Expiry</label>
              <input type="date" value={car.motExpiry} onChange={e => setCar({ ...car, motExpiry: e.target.value })} />
            </div>
          </div>

          <div className="car-field">
            <label>Current Mileage</label>
            <input type="number" placeholder="e.g. 45000" value={car.mileage} onChange={e => setCar({ ...car, mileage: e.target.value })} />
          </div>
          <div className="car-field">
            <label>Service Notes</label>
            <textarea
              placeholder="Service history, reminders, etc."
              value={car.notes}
              onChange={e => setCar({ ...car, notes: e.target.value })}
            />
          </div>

          <div className="car-actions">
            <button type="submit" disabled={saving} className="car-save-btn">
              {saving ? "Saving..." : "Save Car Details"}
            </button>
            {car.make && (
              <button type="button" onClick={() => setEditing(false)} className="car-cancel-btn">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
