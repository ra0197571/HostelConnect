/* js/app.js */

// --- 1. DUMMY DATA SEEDING (Run on first load) ---
const initialHostels = [
    { id: 1, name: "Sunrise Boys Hostel", dist: 0.5, price: 12000, verified: true, rating: 5, facilities: "WiFi, Mess, Generator" },
    { id: 2, name: "Galaxy Girls Hostel", dist: 3.2, price: 15000, verified: true, rating: 4, facilities: "AC, Security, Transport" },
    { id: 3, name: "Scholars Inn", dist: 8.5, price: 9000, verified: false, rating: 3, facilities: "Mess, Laundry" },
    { id: 4, name: "Campus View", dist: 1.2, price: 11000, verified: true, rating: 4, facilities: "WiFi, Attached Bath" }
];

const initialAnnouncements = [
    { id: 1, hostelName: "Sunrise Boys Hostel", msg: "Generator maintenance scheduled for Sunday 10 AM.", date: "2023-10-25" }
];

// --- 2. LOCAL STORAGE MANAGERS ---
function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// Seed Data
if(getData('hostels').length === 0) saveData('hostels', initialHostels);
if(getData('announcements').length === 0) saveData('announcements', initialAnnouncements);

// --- 3. COMMON FUNCTIONS ---
function logout() {
    localStorage.removeItem('currentUserRole');
    window.location.href = 'index.html';
}

function switchTab(tabId) {
    document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    event.target.classList.add('active');
}

function getStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// --- 4. STUDENT PORTAL LOGIC ---
function loadStudentDashboard() {
    // Default load: 10km radius
    filterHostels(10); 
    loadAnnouncements();
    loadStudentBookings();
    loadStudentComplaints();
}

function filterHostels(distance) {
    document.getElementById('distValue').innerText = distance + " km";
    const list = document.getElementById('hostelList');
    list.innerHTML = '';
    
    const hostels = getData('hostels');
    const complaintSelect = document.getElementById('complaintHostelSelect');
    if(complaintSelect) complaintSelect.innerHTML = '<option value="">Select Hostel</option>';

    let found = false;

    hostels.forEach(h => {
        // Populate Complaint Dropdown
        if(complaintSelect) {
            const opt = document.createElement('option');
            opt.value = h.name; opt.text = h.name;
            complaintSelect.appendChild(opt);
        }

        // Distance Logic
        if(h.dist <= distance) {
            found = true;
            list.innerHTML += `
                <div class="card">
                    <div class="card-meta">
                        <span class="badge" style="background:${h.verified ? '#DCFCE7' : '#F3F4F6'}; color:${h.verified ? '#166534' : '#666'}">${h.verified ? 'Verified' : 'Unverified'}</span>
                        <span class="stars">${getStars(h.rating)}</span>
                    </div>
                    <h3>${h.name}</h3>
                    <p class="text-sm">📍 ${h.dist} km from Campus</p>
                    <p class="text-sm">💰 PKR ${h.price} / month</p>
                    <p class="text-sm" style="color:var(--secondary); margin-top:5px;">${h.facilities}</p>
                    
                    <hr style="border:0; border-top:1px solid #eee; margin:15px 0;">
                    
                    <div style="display:flex; gap:10px;">
                        <select id="roomType-${h.id}" class="form-control" style="margin:0; padding:8px; width:60%;">
                            <option value="Single">Single Room</option>
                            <option value="Shared (2)">Shared (2 Persons)</option>
                            <option value="Shared (4)">Shared (4 Persons)</option>
                        </select>
                        <button onclick="bookRoom(${h.id}, '${h.name}')" class="btn" style="padding:8px; font-size:0.9rem;">Book</button>
                    </div>
                </div>
            `;
        }
    });

    if(!found) list.innerHTML = `<p style="text-align:center; width:100%; color:gray;">No hostels found within ${distance}km.</p>`;
}

function loadAnnouncements() {
    const list = document.getElementById('announcementList');
    if(!list) return;
    const data = getData('announcements');
    list.innerHTML = data.length ? '' : '<p class="text-sm">No recent announcements.</p>';
    
    data.forEach(a => {
        list.innerHTML += `
            <div style="background:#FEF9C3; padding:10px; border-radius:5px; margin-bottom:10px; border-left:4px solid #F59E0B;">
                <strong style="display:block; font-size:0.9rem;">📢 ${a.hostelName}</strong>
                <span class="text-sm">${a.msg}</span>
            </div>
        `;
    });
}

function bookRoom(hostelId, hostelName) {
    const roomType = document.getElementById(`roomType-${hostelId}`).value;
    const bookings = getData('bookings');
    
    bookings.push({
        id: Date.now(),
        hostelName,
        studentName: "Wareesha Rehman", // MVP Hardcoded
        roomType,
        status: "Pending",
        date: new Date().toLocaleDateString()
    });
    
    saveData('bookings', bookings);
    alert(`Booking Request Sent for ${roomType} at ${hostelName}`);
    loadStudentBookings();
    switchTab('my-bookings');
}

function submitComplaint(e) {
    e.preventDefault();
    const hostel = document.getElementById('complaintHostelSelect').value;
    const issue = document.getElementById('complaintText').value;
    if(!hostel) return alert("Please select a hostel");

    const complaints = getData('complaints');
    complaints.push({
        id: Date.now(),
        hostelName: hostel,
        studentName: "Wareesha Rehman",
        issue,
        status: "Pending"
    });
    
    saveData('complaints', complaints);
    alert("Complaint Submitted!");
    e.target.reset();
    loadStudentComplaints();
}

function loadStudentBookings() {
    const list = document.getElementById('bookingList');
    const bookings = getData('bookings');
    list.innerHTML = bookings.length ? '' : '<p>No booking history.</p>';
    bookings.forEach(b => {
        list.innerHTML += `
            <div class="card">
                <div class="card-meta"><span class="badge status-${b.status}">${b.status}</span> <span>${b.date}</span></div>
                <h3>${b.hostelName}</h3>
                <p>Room Type: <strong>${b.roomType}</strong></p>
            </div>`;
    });
}

function loadStudentComplaints() {
    const list = document.getElementById('studentComplaintList');
    const complaints = getData('complaints');
    list.innerHTML = '';
    complaints.forEach(c => {
        list.innerHTML += `
            <div class="card" style="border-left:4px solid ${c.status === 'Resolved' ? 'green' : 'orange'}">
                <p><strong>${c.hostelName}</strong></p>
                <p>${c.issue}</p>
                <p class="text-sm mt-2">Status: <b>${c.status}</b></p>
            </div>`;
    });
}

// --- 5. HOSTEL MANAGER LOGIC ---
function loadHostelDashboard() {
    loadHostelBookings();
    loadHostelComplaints();
}

function loadHostelBookings() {
    const list = document.getElementById('hostelBookings');
    const bookings = getData('bookings');
    list.innerHTML = bookings.length ? '' : '<p>No pending requests.</p>';
    
    bookings.forEach(b => {
        list.innerHTML += `
            <div class="card">
                <div class="card-meta"><span class="badge status-${b.status}">${b.status}</span></div>
                <h3>${b.studentName}</h3>
                <p>Requested: <strong>${b.roomType}</strong></p>
                ${b.status === 'Pending' ? `
                    <div style="margin-top:10px; display:flex; gap:10px;">
                        <button onclick="updateBooking(${b.id}, 'Approved')" class="btn" style="background:var(--success)">Approve</button>
                        <button onclick="updateBooking(${b.id}, 'Rejected')" class="btn" style="background:var(--danger)">Reject</button>
                    </div>
                ` : ''}
            </div>`;
    });
}

function updateBooking(id, status) {
    let bookings = getData('bookings');
    bookings = bookings.map(b => b.id === id ? {...b, status} : b);
    saveData('bookings', bookings);
    loadHostelBookings();
}

function loadHostelComplaints() {
    const list = document.getElementById('hostelComplaints');
    const complaints = getData('complaints');
    list.innerHTML = complaints.length ? '' : '<p>No complaints.</p>';
    
    complaints.forEach(c => {
        list.innerHTML += `
            <div class="card">
                <p><strong>${c.studentName}:</strong> ${c.issue}</p>
                <p class="text-sm">Status: <b>${c.status}</b></p>
                ${c.status === 'Pending' ? `<button onclick="resolveComplaint(${c.id})" class="btn mt-2">Mark Resolved</button>` : ''}
            </div>`;
    });
}

function resolveComplaint(id) {
    let complaints = getData('complaints');
    complaints = complaints.map(c => c.id === id ? {...c, status: 'Resolved'} : c);
    saveData('complaints', complaints);
    loadHostelComplaints();
}

function postAnnouncement(e) {
    e.preventDefault();
    const msg = document.getElementById('announceMsg').value;
    const anns = getData('announcements');
    anns.unshift({ id: Date.now(), hostelName: "My Hostel", msg, date: new Date().toLocaleDateString() });
    saveData('announcements', anns);
    alert("Announcement Posted!");
    e.target.reset();
}

// --- 6. ADMIN LOGIC ---
function loadAdminDashboard() {
    const hostels = getData('hostels');
    document.getElementById('totalHostels').innerText = hostels.length;
    document.getElementById('totalComplaints').innerText = getData('complaints').length;
    
    const list = document.getElementById('adminHostelList');
    list.innerHTML = '';
    hostels.forEach(h => {
        list.innerHTML += `
            <div class="card">
                <div class="card-meta"><span class="badge">${h.verified ? 'Verified' : 'Pending'}</span></div>
                <h3>${h.name}</h3>
                <p>${h.dist} km | Rating: ${h.rating}</p>
                ${!h.verified ? `<button onclick="verifyHostel(${h.id})" class="btn mt-2">Verify</button>` : ''}
            </div>`;
    });
}

function verifyHostel(id) {
    let hostels = getData('hostels');
    hostels = hostels.map(h => h.id === id ? {...h, verified: true} : h);
    saveData('hostels', hostels);
    loadAdminDashboard();
}