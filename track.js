import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// 🔧 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDOURdB1SE018tDRe9RxVp7PIV8oDnLbzs",
  authDomain: "map-journal-5738f.firebaseapp.com",
  projectId: "map-journal-5738f",
  storageBucket: "map-journal-5738f.appspot.com",
  messagingSenderId: "754274852438",
  appId: "1:754274852438:web:3a1d490a8b95a55544e5f7",
  measurementId: "G-VXDJVT0ZG3"
};

// 🔌 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserId = null;
let map, marker, selectedPlaceName = "";

// 🔓 Allow access regardless of auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
  }
  initMap(); // Always initialize the map
});

// 🗺️ Map Setup
function initMap() {
  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  L.Control.geocoder({
    defaultMarkGeocode: false
  })
    .on("markgeocode", function (e) {
      const center = e.geocode.center;
      selectedPlaceName = e.geocode.name;
      map.setView(center, 10);
      if (marker) marker.remove();
      marker = L.marker(center).addTo(map);
    })
    .addTo(map);

  // 📌 Allow user to pin location by clicking on the map
  map.on("click", async function (e) {
    const { lat, lng } = e.latlng;

    // Try to reverse-geocode the clicked point
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await response.json();

      selectedPlaceName = data.display_name || `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

      // Update the input field with the place name
      document.getElementById("placeInput").value = selectedPlaceName;
    } catch (err) {
      console.warn("Reverse geocoding failed:", err);
      selectedPlaceName = `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      document.getElementById("placeInput").value = selectedPlaceName;
    }

    // Set or move the marker
    if (marker) marker.remove();
    marker = L.marker([lat, lng]).addTo(map);
  });

  setTimeout(() => map.invalidateSize(), 300);
}

// 🔍 Manual Place Search
window.saveToFirebase = async function () {
  if (!marker) return alert("📍 Please mark a location on the map first.");

  const description = document.getElementById("description").value.trim();
  const fileInput = document.getElementById("photoInput");
  const files = fileInput.files;
  const imageUrlInput = document.getElementById("imageUrlInput").value.trim();
  const linkUrlInput = document.getElementById("urlInput").value.trim();

  let imageUrl = "";

  try {
    // 1. If user uploaded a file, convert it to base64
    if (files.length > 0) {
      const base64 = await convertToBase64(files[0]); // just first file
      imageUrl = base64;
    }
    // 2. If no file, but user entered an image URL, use that
    else if (imageUrlInput) {
      imageUrl = imageUrlInput;
    }

    // Save to Firestore
    await addDoc(collection(db, "users", currentUserId, "locations"), {
      placeName: selectedPlaceName || "Unknown Location",
      lat: marker.getLatLng().lat,
      lon: marker.getLatLng().lng,
      description: description,
      imageUrl: imageUrl,
      linkUrl: linkUrlInput || "",
      timestamp: new Date()
    });

    alert("✅ Location saved!");

    // Reset form
    document.getElementById("description").value = "";
    document.getElementById("placeInput").value = "";
    document.getElementById("imageUrlInput").value = "";
    document.getElementById("urlInput").value = "";
    fileInput.value = "";
    selectedPlaceName = "";
    if (marker) {
      marker.remove();
      marker = null;
    }
    map.setView([20, 0], 2);
  } catch (error) {
    console.error("❌ Error saving:", error);
    alert("❌ Failed to save. Check console for details.");
  }
};


// 📸 Convert file to Base64
function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // base64 string
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 💾 Save to Firestore
window.saveToFirebase = async function () {
  if (!marker) return alert("📍 Please mark a location on the map first.");

  const description = document.getElementById("description").value.trim();
  const fileInput = document.getElementById("photoInput");
  const files = fileInput.files;

  let imageUrl = "";

  try {
    if (files.length > 0) {
      const base64 = await convertToBase64(files[0]); // just first file
      imageUrl = base64;
    }

    await addDoc(collection(db, "users", currentUserId, "locations"), {
      placeName: selectedPlaceName || "Unknown Location",
      lat: marker.getLatLng().lat,
      lon: marker.getLatLng().lng,
      description: description,
      imageUrl: imageUrl,
      timestamp: new Date()
    });

    alert("✅ Location saved!");

    // Reset form
    document.getElementById("description").value = "";
    document.getElementById("placeInput").value = "";
    fileInput.value = "";
    selectedPlaceName = "";
    if (marker) {
      marker.remove();
      marker = null;
    }
    map.setView([20, 0], 2);
  } catch (error) {
    console.error("❌ Error saving:", error);
    alert("❌ Failed to save. Check console for details.");
  }
};
