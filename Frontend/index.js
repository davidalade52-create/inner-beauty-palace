// Curriculum Dynamic Content Switcher
        const dayData = {
            1: { badge: "DAY 1", title: "Craft Foundations", desc: "How to make handcrafted fashion items such as Fascinators, Berets, and more signature pieces." },
            2: { badge: "DAY 2", title: "Tools & Material Sourcing", desc: "Sourcing premium materials affordably and mastering essential tool handling for professional finish." },
            3: { badge: "DAY 3", title: "Zero-capital Business Launch", desc: "Building your business structure and generating pre-orders with zero initial production capital." },
            4: { badge: "DAY 4", title: "Smartphone Content & Strategy", desc: "Capturing stunning photos, editing videos with your phone, and driving sales through social media." },
            5: { badge: "DAY 5", title: "Fashion as Influence", desc: "Mistakes to avoid in Fashion-preneurship and a deeper understanding of fashion as a mountain of influence." }
        };

        function switchDay(dayNumber) {
            document.querySelectorAll('.day-tab').forEach((tab, index) => {
                if (index + 1 === dayNumber) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });

            document.getElementById('cardDayBadge').innerText = dayData[dayNumber].badge;
            document.getElementById('cardDayTitle').innerText = dayData[dayNumber].title;
            document.getElementById('cardDayDesc').innerText = dayData[dayNumber].desc;
        }

        // Form Submit Handler
        document.getElementById('registrationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const responseMsg = document.getElementById('responseMsg');
            responseMsg.innerText = "Submitting registration...";
            responseMsg.style.color = "#ebd8ff";

            const payload = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                gender: document.getElementById('gender').value,
                location: document.getElementById('location').value,
                motivation: document.getElementById('motivation').value
            };

            try {
                const response = await fetch('http://localhost:5000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok) {
                    responseMsg.style.color = "#80ff80";
                    responseMsg.innerText = "Registration completed successfully!";
                    document.getElementById('registrationForm').reset();
                } else {
                    responseMsg.style.color = "#ff8080";
                    responseMsg.innerText = result.error || "Registration failed.";
                }
            } catch (error) {
                responseMsg.style.color = "#ff8080";
                responseMsg.innerText = "Server connection error.";
            }

            async function checkRegistration() {
    const query = document.getElementById('lookupInput').value.trim();
    const resultDiv = document.getElementById('lookupResult');

    if (!query) return alert('Please enter your email or registration code.');

    resultDiv.innerHTML = "Searching...";

    try {
        const response = await fetch('http://localhost:5000/api/student/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const res = await response.json();

        if (response.ok) {
            const data = res.data;
            resultDiv.innerHTML = `
                <div style="background: rgba(224, 180, 79, 0.15); border: 1px solid var(--gold-primary); padding: 15px; border-radius: 10px; color: white;">
                    <p style="color: var(--gold-primary); font-weight: bold;">Status: Registered ✅</p>
                    <p><strong>Code:</strong> ${data.registrationCode}</p>
                    <p><strong>Name:</strong> ${data.fullName}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Phone:</strong> ${data.phone}</p>
                    <p><strong>Location:</strong> ${data.location}</p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<p style="color: #ff8080;">${res.error}</p>`;
        }
    } catch (err) {
        resultDiv.innerHTML = `<p style="color: #ff8080;">Server error. Please try again.</p>`;
    }
}
        });