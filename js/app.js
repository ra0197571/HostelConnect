/* js/app.js - FINAL DEMO VERSION */

/* =====================================================
   1. DATA HANDLING & UTILS
===================================================== */

const SEED_HOSTELS = [
    { id: 1, name: "Sunrise Boys Hostel", dist: 0.5, price: 12000, verified: true, rating: 5, facilities: "WiFi, Mess, Generator" },
    { id: 2, name: "Galaxy Girls Hostel", dist: 2.5, price: 15000, verified: true, rating: 4.8, facilities: "AC, Security, Gym" },
    { id: 3, name: "Scholars Inn", dist: 8.5, price: 9000, verified: false, rating: 3, facilities: "Mess, Laundry" },
    { id: 4, name: "Campus View", dist: 1.2, price: 11000, verified: true, rating: 4, facilities: "WiFi, Attached Bath" }
];

const SEED_ANNOUNCEMENTS = [
    { id: 1, hostelName: "Sunrise Boys Hostel", msg: "Generator maintenance scheduled for Sunday 10 AM.", date: "2026-01-12" }
];

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// Auto-Clear Old Data to prevent Crashes (Version Control)
if (!localStorage.getItem('v2_setup')) {
    localStorage.clear();
    localStorage.setItem('v2_setup', 'true');
    saveData("hostels", SEED_HOSTELS);
    saveData("announcements", SEED_ANNOUNCEMENTS);
    location.reload();
}

/* =====================================================
   2. SHARED FUNCTIONS
===================================================== */

function logout() {
    localStorage.removeItem("currentUserRole");
    window.location.href = "index.html";
}

function switchTab(tabId) {
    document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    const el = document.getElementById(tabId);
    if(el) el.classList.remove("hidden");
    if(event) event.target.classList.add("active");
}

function renderStars(rating) {
    if (!rating) rating = 5; // Default safe value
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
}

/* =====================================================
   3. STUDENT DASHBOARD
===================================================== */

function loadStudentDashboard() {
    filterHostels(10);
    loadAnnouncements();
    loadStudentBookings();
    loadStudentComplaints();
}

/* =====================================================
   UPDATED: STUDENT FILTER LOGIC (Checks Availability)
===================================================== */

function filterHostels(maxDistance) {
    const distLabel = document.getElementById("distValue");
    if(distLabel) distLabel.innerText = `${maxDistance} km`;
    
    const hostelList = document.getElementById("hostelList");
    if(!hostelList) return;

    const complaintDropdown = document.getElementById("complaintHostelSelect");
    hostelList.innerHTML = "";
    if (complaintDropdown) complaintDropdown.innerHTML = `<option value="">Select Hostel</option>`;

    const hostels = getData("hostels");
    const favorites = getData("favorites") || []; 

    let hostelFound = false;

    hostels.forEach(hostel => {
        // Availability Check (Default true if undefined)
        const isAvailable = hostel.available !== false; 

        if (complaintDropdown) {
            const option = document.createElement("option");
            option.value = hostel.name;
            option.textContent = hostel.name;
            complaintDropdown.appendChild(option);
        }

        if (hostel.dist <= maxDistance) {
            hostelFound = true;
            const isFav = favorites.includes(hostel.id);
            const safeRating = hostel.rating || 5;

            // --- BUTTON LOGIC CHANGE ---
            let actionButtons = '';
            
            if (isAvailable) {
                // Agar Available hai to Book button dikhao
                actionButtons = `
                    <div style="display:flex; gap:10px;">
                        <select id="roomType-${hostel.id}" class="form-control" style="margin:0; width:60%">
                            <option value="Single">Single Room</option>
                            <option value="Shared">Shared Room</option>
                        </select>
                        <button class="btn btn-primary" onclick="bookRoom(${hostel.id}, '${hostel.name}')">Book</button>
                    </div>`;
            } else {
                // Agar Full hai to Grey button dikhao
                actionButtons = `
                    <div style="width:100%; background:#F3F4F6; color:#EF4444; padding:10px; text-align:center; border-radius:6px; font-weight:bold; border:1px solid #EF4444;">
                        ⛔ Booking Closed (Full)
                    </div>`;
            }

            hostelList.innerHTML += `
                <div class="card" style="${!isAvailable ? 'opacity:0.8; background:#fafafa;' : ''}">
                    <div class="card-meta">
                        <span class="badge" style="background:${hostel.verified?'#DCFCE7':'#eee'}">${hostel.verified ? "Verified" : "Unverified"}</span>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span class="stars" style="color:#F59E0B">${renderStars(safeRating)}</span>
                            <span style="font-size:0.8rem; color:#666;">(${safeRating.toFixed(1)})</span>
                            <button class="heart-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${hostel.id})" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">
                                ${isFav ? '❤️' : '🤍'}
                            </button>
                        </div>
                    </div>

                    <h3>${hostel.name} ${!isAvailable ? '<span style="color:red; font-size:0.8rem;">(FULL)</span>' : ''}</h3>
                    <p class="text-sm">📍 ${hostel.dist} km | 💰 PKR ${hostel.price}</p>
                    <p class="text-sm" style="margin-bottom:10px; color:#666;">${hostel.facilities}</p>

                    <hr style="margin:10px 0; border-top:1px solid #eee;">

                    <div style="margin-bottom:10px;">
                         <button class="btn" onclick="openReviewModal(${hostel.id})" style="background:#F3F4F6; color:#333; font-size:0.85rem; padding:5px 10px;">⭐ Rate & Review</button>
                    </div>

                    <!-- DYNAMIC ACTION BUTTONS -->
                    ${actionButtons}
                </div>
            `;
        }
    });

    if (!hostelFound) hostelList.innerHTML = `<p style="grid-column:1/-1; text-align:center;">No hostels found.</p>`;
}

function loadAnnouncements() {
    const container = document.getElementById("announcementList");
    if(!container) return;
    const announcements = getData("announcements");
    container.innerHTML = announcements.length ? "" : "";
    announcements.forEach(a => {
        container.innerHTML += `
            <div style="background:#FFFBEB; border-left:4px solid #F59E0B; padding:15px; margin-bottom:20px; border-radius:4px;">
                <strong style="color:#B45309">📢 ${a.hostelName}</strong>
                <p style="font-size:0.9rem; margin-top:4px;">${a.msg}</p>
            </div>`;
    });
}

function bookRoom(hostelId, hostelName) {
    const roomType = document.getElementById(`roomType-${hostelId}`).value;
    
    // Price dhundo
    const hostels = getData("hostels");
    const hostel = hostels.find(h => h.id === hostelId);
    const rent = hostel.price;
    const fee = rent * 0.05; // 5% Commission
    const total = rent + fee;

    // Modal mein values set karo
    document.getElementById("payRent").innerText = `PKR ${rent}`;
   
    
    // Hidden fields set karo
    document.getElementById("payHostelId").value = hostelId;
    document.getElementById("payHostelName").value = hostelName;
    document.getElementById("payRoomType").value = roomType;

    // Modal Kholo
    document.getElementById("paymentModal").classList.remove("hidden");
}

function submitComplaint(event) {
    event.preventDefault();
    const hostel = document.getElementById("complaintHostelSelect").value;
    const issue = document.getElementById("complaintText").value;
    if (!hostel) return alert("Please select a hostel.");
    
    const complaints = getData("complaints");
    complaints.push({ id: Date.now(), hostelName: hostel, studentName: " Rehman", issue, status: "Pending" });
    saveData("complaints", complaints);
    event.target.reset();
    loadStudentComplaints();
    alert("Complaint submitted!");
}

function loadStudentBookings() {
    const list = document.getElementById("bookingList");
    if(!list) return;
    const bookings = getData("bookings");
    list.innerHTML = bookings.length ? "" : "<p>No bookings found.</p>";
    bookings.forEach(b => {
        list.innerHTML += `<div class="card"><h3>${b.hostelName}</h3><p class="text-sm">Status: <b>${b.status}</b></p></div>`;
    });
}

function loadStudentComplaints() {
    const list = document.getElementById("studentComplaintList");
    if(!list) return;
    const complaints = getData("complaints");
    list.innerHTML = complaints.length ? "" : "<p>No complaints.</p>";
    complaints.forEach(c => {
        list.innerHTML += `<div class="card"><strong>${c.hostelName}</strong><p>${c.issue}</p><p>Status: ${c.status}</p></div>`;
    });
}

/* =====================================================
   4. HOSTEL MANAGER LOGIC
===================================================== */

/* =====================================================
   UPDATED: HOSTEL MANAGER LOGIC WITH STATS
===================================================== */

/* =====================================================
   UPDATED: MANAGER AVAILABILITY LOGIC
===================================================== */

function loadHostelDashboard() {
    loadHostelBookings();
    loadHostelComplaints();
    loadProfileData(); 

    // Stats Count
    const bookings = getData("bookings");
    const complaints = getData("complaints");
    document.getElementById("statRequests").innerText = bookings.filter(b => b.status === "Pending").length;
    document.getElementById("statComplaints").innerText = complaints.filter(c => c.status === "Pending").length;

    // --- NEW: Load Switch State from DB ---
    const hostels = getData("hostels");
    const myHostel = hostels.find(h => h.id === MANAGER_HOSTEL_ID);
    
    // Checkbox ko set karein (Default true/online)
    const switchBtn = document.querySelector('.switch input');
    const statusText = document.getElementById("statusText");
    
    if (myHostel && switchBtn) {
        // Agar 'available' property nahi hai to true maano
        const isOnline = myHostel.available !== false; 
        switchBtn.checked = isOnline;
        statusText.innerText = isOnline ? "Online (Accepting)" : "Offline (Full)";
        statusText.style.color = isOnline ? "green" : "red";
    }
}

function toggleAvailability(checkbox) {
    const isOnline = checkbox.checked;
    const text = document.getElementById("statusText");
    
    // UI Update
    text.innerText = isOnline ? "Online (Accepting)" : "Offline (Full)";
    text.style.color = isOnline ? "green" : "red";

    // Database Update
    let hostels = getData("hostels");
    const index = hostels.findIndex(h => h.id === MANAGER_HOSTEL_ID);
    
    if (index !== -1) {
        hostels[index].available = isOnline; // Status save kar rahe hain
        saveData("hostels", hostels);
        
        if(!isOnline) alert("⚠️ Hostel marked as FULL. Students cannot book now.");
        else alert("✅ Hostel marked as OPEN.");
    }
}

function loadHostelBookings() {
    const list = document.getElementById("hostelBookings");
    if(!list) return;
    const bookings = getData("bookings");
    list.innerHTML = bookings.length ? "" : "<p>No pending requests.</p>";
    bookings.forEach(b => {
        list.innerHTML += `
            <div class="card">
                <h3>${b.studentName}</h3>
                <p>Room: ${b.roomType}</p>
                <p>Status: <b>${b.status}</b></p>
                ${b.status === 'Pending' ? `
                    <div class="mt-2"><button onclick="updateBooking(${b.id}, 'Approved')" class="btn" style="background:green;color:white;width:auto;margin-right:10px;">Approve</button>
                    <button onclick="updateBooking(${b.id}, 'Rejected')" class="btn" style="background:red;color:white;width:auto;">Reject</button></div>
                ` : ''}
            </div>`;
    });
}

function updateBooking(id, status) {
    let bookings = getData("bookings");
    bookings = bookings.map(b => b.id === id ? {...b, status} : b);
    saveData("bookings", bookings);
    loadHostelBookings();
}

function loadHostelComplaints() {
    const list = document.getElementById("hostelComplaints");
    if(!list) return;
    const complaints = getData("complaints");
    list.innerHTML = complaints.length ? "" : "<p>No complaints.</p>";
    complaints.forEach(c => {
        list.innerHTML += `<div class="card"><p>${c.issue}</p><p>Status: ${c.status}</p>${c.status==='Pending' ? `<button onclick="resolveComplaint(${c.id})" class="btn mt-2">Resolve</button>`:''}</div>`;
    });
}

function resolveComplaint(id) {
    let complaints = getData("complaints");
    complaints = complaints.map(c => c.id === id ? {...c, status: 'Resolved'} : c);
    saveData("complaints", complaints);
    loadHostelComplaints();
}

function postAnnouncement(e) {
    e.preventDefault();
    const msg = document.getElementById('announceMsg').value;
    const anns = getData('announcements');
    anns.unshift({ id: Date.now(), hostelName: "My Hostel", msg, date: new Date().toLocaleDateString() });
    saveData('announcements', anns);
    alert("Posted!");
    e.target.reset();
}

// Manager Profile
const MANAGER_HOSTEL_ID = 1;
function loadProfileData() {
    const hostels = getData("hostels");
    const myHostel = hostels.find(h => h.id === MANAGER_HOSTEL_ID);
    if (myHostel && document.getElementById("editName")) {
        document.getElementById("editName").value = myHostel.name;
        document.getElementById("editDist").value = myHostel.dist;
        document.getElementById("editPrice").value = myHostel.price;
        document.getElementById("editFac").value = myHostel.facilities;
    }
}

function updateHostelProfile(event) {
    event.preventDefault();
    const name = document.getElementById("editName").value;
    const dist = parseFloat(document.getElementById("editDist").value);
    const price = document.getElementById("editPrice").value;
    const facilities = document.getElementById("editFac").value;

    let hostels = getData("hostels");
    const index = hostels.findIndex(h => h.id === MANAGER_HOSTEL_ID);
    if (index !== -1) {
        hostels[index].name = name;
        hostels[index].dist = dist;
        hostels[index].price = price;
        hostels[index].facilities = facilities;
        saveData("hostels", hostels);
        alert("Saved!");
    }
}

/* =====================================================
   5. ADMIN LOGIC
===================================================== */

/* =====================================================
   UPDATED: ADMIN DASHBOARD LOGIC (With Delete & Reset)
===================================================== */

function loadAdminDashboard() {
    const hostels = getData("hostels");
    const bookings = getData("bookings");
    const complaints = getData("complaints");

    // 1. Update Stats
    document.getElementById('totalHostels').innerText = hostels.length;
    document.getElementById('totalComplaints').innerText = complaints.length;

    // Revenue Calc
    let totalRevenue = 0;
    bookings.forEach(b => { if (b.feeEarned) totalRevenue += b.feeEarned; });
    document.getElementById('totalRevenue').innerText = `PKR ${totalRevenue.toLocaleString()}`;

    // 2. Render Hostel List with DELETE Option
    const list = document.getElementById("adminHostelList");
    list.innerHTML = "";

    if (hostels.length === 0) {
        list.innerHTML = "<p>No hostels registered.</p>";
        return;
    }

    hostels.forEach(h => {
        list.innerHTML += `
            <div class="card" style="position: relative;">
                
                <!-- Status Badge -->
                <div class="card-meta">
                    <span class="badge" style="background:${h.verified ? '#DCFCE7' : '#FEE2E2'}; color:${h.verified ? '#166534' : '#991B1B'}">
                        ${h.verified ? 'Verified' : 'Pending Verification'}
                    </span>
                </div>

                <h3>${h.name}</h3>
                <p class="text-sm" style="color: #666;">Rating: ${h.rating ? h.rating.toFixed(1) : 'New'} | ${h.dist} km</p>
                <p class="text-sm" style="margin-bottom: 10px;">Rent: PKR ${h.price}</p>

                <!-- ACTION BUTTONS -->
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    
                    <!-- Verify Button (Only if not verified) -->
                    ${!h.verified ? `
                        <button onclick="verifyHostel(${h.id})" class="btn btn-primary" style="flex: 1; padding: 8px; font-size: 0.85rem;">
                            ✅ Verify
                        </button>
                    ` : `
                        <button disabled class="btn" style="flex: 1; background: #eee; color: #aaa; cursor: not-allowed; padding: 8px; font-size: 0.85rem;">
                            Already Verified
                        </button>
                    `}

                    <!-- Delete Button (Red) -->
                    <button onclick="deleteHostel(${h.id})" class="btn" style="flex: 1; background: #EF4444; color: white; padding: 8px; font-size: 0.85rem;">
                        🗑️ Remove
                    </button>
                </div>

            </div>`;
    });
}

// --- NEW FEATURES ---

function verifyHostel(id) {
    let hostels = getData("hostels");
    hostels = hostels.map(h => h.id === id ? {...h, verified: true} : h);
    saveData("hostels", hostels);
    alert("Hostel Verified Successfully!");
    loadAdminDashboard();
}

function deleteHostel(id) {
    // Confirmation Alert
    if(confirm("⚠️ Are you sure you want to PERMANENTLY REMOVE this hostel from the system?")) {
        let hostels = getData("hostels");
        // Filter out the hostel with matching ID
        hostels = hostels.filter(h => h.id !== id);
        
        saveData("hostels", hostels);
        loadAdminDashboard(); // Refresh UI
    }
}

function factoryReset() {
    const code = prompt("Type 'RESET' to confirm deleting ALL DATA (Hostels, Bookings, Users):");
    if (code === "RESET") {
        localStorage.clear();
        alert("♻️ System Reset Complete! Reloading...");
        location.reload();
    } else {
        alert("Reset Cancelled.");
    }
}

function verifyHostel(id) {
    let hostels = getData("hostels");
    hostels = hostels.map(h => h.id === id ? {...h, verified: true} : h);
    saveData("hostels", hostels);
    loadAdminDashboard();
}

/* =====================================================
   6. EXTRA FEATURES (SOS, FAV, REVIEW)
===================================================== */

function triggerSOS() {
    if(confirm("🚨 EMERGENCY: Send SOS to Security?")) alert("✅ SOS Sent! Help is coming.");
}

function toggleFavorite(hostelId) {
    let favorites = getData("favorites");
    if(!Array.isArray(favorites)) favorites = [];
    if (favorites.includes(hostelId)) favorites = favorites.filter(id => id !== hostelId);
    else favorites.push(hostelId);
    saveData("favorites", favorites);
    const slider = document.querySelector('input[type="range"]');
    if(slider) filterHostels(slider.value);
}

function openReviewModal(hostelId) {
    const modal = document.getElementById("reviewModal");
    if(modal) {
        modal.classList.remove("hidden");
        document.getElementById("reviewHostelId").value = hostelId;
    }
}

function closeReviewModal() {
    const modal = document.getElementById("reviewModal");
    if(modal) modal.classList.add("hidden");
}

function submitReview(e) {
    e.preventDefault();
    const hostelId = parseInt(document.getElementById("reviewHostelId").value);
    const rating = parseInt(document.getElementById("reviewStars").value);
    
    let hostels = getData("hostels");
    const index = hostels.findIndex(h => h.id === hostelId);
    if(index !== -1) {
        const oldRating = hostels[index].rating || 5;
        hostels[index].rating = (oldRating + rating) / 2;
        saveData("hostels", hostels);
    }
    alert("Review Added!");
    closeReviewModal();
    const slider = document.querySelector('input[type="range"]');
    if(slider) filterHostels(slider.value);
}
/* =====================================================
   NEW: NOTIFICATION SYSTEM logic
===================================================== */

function showNotifications() {
    // 1. Get Announcement Data
    const anns = getData("announcements");
    const latest = anns.length > 0 ? anns[0] : null;

    if (latest) {
        // 2. Show Alert
        alert(`🔔 New Notification from ${latest.hostelName}:\n\n"${latest.msg}"\n\n📅 Date: ${latest.date}`);
        
        // 3. Remove Red Badge (Mark as Read)
        const badge = document.getElementById("notifBadge");
        if(badge) badge.style.display = "none";
    } else {
        alert("🔕 No new notifications.");
    }
}
/* =====================================================
   NEW: AI CHATBOT LOGIC
===================================================== */

function toggleChat() {
    const chat = document.getElementById("chatWindow");
    if(chat.classList.contains("hidden")) {
        chat.classList.remove("hidden");
    } else {
        chat.classList.add("hidden");
    }
}

function sendMessage() {
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    const chatBody = document.getElementById("chatBody");

    if(msg === "") return;

    // 1. User Message
    chatBody.innerHTML += `
        <div style="align-self: flex-end; background: var(--primary); color: white; padding: 8px 12px; border-radius: 10px 10px 0 10px; font-size: 0.9rem; max-width: 80%;">
            ${msg}
        </div>
    `;
    input.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    // 2. Fake AI Typing... (1 sec delay)
    setTimeout(() => {
        let reply = "I can help you find hostels. Try searching by distance!";
        
        // Simple Keywords Logic
        if(msg.toLowerCase().includes("hello") || msg.toLowerCase().includes("hi")) reply = "Hello! Looking for a hostel today?";
        if(msg.toLowerCase().includes("price") || msg.toLowerCase().includes("rent")) reply = "Hostel rents usually range from 9,000 to 15,000 PKR.";
        if(msg.toLowerCase().includes("wifi")) reply = "Most verified hostels provide high-speed WiFi.";
        if(msg.toLowerCase().includes("food") || msg.toLowerCase().includes("mess")) reply = "Yes, check the hostel details to see if Mess is included.";

        chatBody.innerHTML += `
            <div style="align-self: flex-start; background: white; padding: 8px 12px; border-radius: 10px 10px 10px 0; border: 1px solid #eee; font-size: 0.9rem; max-width: 80%;">
                ${reply}
            </div>
        `;
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 1000);
}

// Allow "Enter" key to send
document.getElementById("chatInput")?.addEventListener("keypress", function(e) {
    if (e.key === "Enter") sendMessage();
});
/* =====================================================
   FIXED: NOTIFICATION DROPDOWN LOGIC
===================================================== */

function toggleNotifications() {
    const dropdown = document.getElementById("notificationDropdown");
    const content = document.getElementById("notifContent");
    const badge = document.getElementById("notifBadge");

    // 1. Toggle Visibility
    if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        
        // 2. Badge Hide karein (Read ho gaya)
        if(badge) badge.style.display = "none";

        // 3. Data Load karein
        const anns = getData("announcements");
        content.innerHTML = ""; // Purana text saaf karein

        if (anns.length > 0) {
            // Saari announcements loop karein
            anns.forEach(a => {
                content.innerHTML += `
                    <div style="padding: 10px; border-bottom: 1px solid #f0f0f0; display: flex; flex-direction: column; gap: 2px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong style="font-size: 0.85rem; color: var(--primary);">${a.hostelName}</strong>
                            <small style="font-size: 0.7rem; color: #999;">${a.date}</small>
                        </div>
                        <p style="font-size: 0.8rem; color: #333; margin: 0;">${a.msg}</p>
                    </div>
                `;
            });
        } else {
            content.innerHTML = `<p style="padding: 15px; font-size: 0.85rem; color: #666; text-align: center;">No new notifications.</p>`;
        }

    } else {
        dropdown.classList.add("hidden");
    }
}

// Close dropdown when clicking outside
window.onclick = function(event) {
    if (!event.target.closest('.header')) {
        const dropdown = document.getElementById("notificationDropdown");
        if (dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    }
}
/* =====================================================
   NEW: PAYMENT & REVENUE LOGIC
===================================================== */

function closePaymentModal() {
    document.getElementById("paymentModal").classList.add("hidden");
}

function processPayment(e) {
    e.preventDefault();
    const btn = document.getElementById("payBtn");
    
    // 1. Fake Loading Animation
    btn.innerHTML = "Processing...";
    btn.style.opacity = "0.7";

    setTimeout(() => {
        // 2. Get Data from Hidden Fields
        const hostelId = parseInt(document.getElementById("payHostelId").value);
        const hostelName = document.getElementById("payHostelName").value;
        const roomType = document.getElementById("payRoomType").value;
        
        // 3. Save Booking
        const bookings = getData("bookings");
        
        // Calculate Fee for Admin Record
        const hostels = getData("hostels");
        const hostel = hostels.find(h => h.id === hostelId);
        const fee = hostel.price * 0.05; // 5% Earnings

        bookings.push({
            id: Date.now(),
            hostelName,
            studentName: "   ",
            roomType,
            status: "Pending", // Paid but pending approval
            paymentStatus: "Paid",
            feeEarned: fee, // Saving commission
            date: new Date().toLocaleDateString()
        });

        saveData("bookings", bookings);

        // 4. Success UI
        alert("✅ Payment Successful! Booking Request Sent.");
        closePaymentModal();
        btn.innerHTML = "Pay Now";
        btn.style.opacity = "1";
        
        loadStudentBookings();
        switchTab("my-bookings");

    }, 2000); // 2 Seconds wait time
}