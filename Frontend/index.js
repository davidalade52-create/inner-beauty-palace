document.getElementById('registrationForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const responseMsg = document.getElementById('responseMsg');
  responseMsg.innerText = "Submitting registration...";
  responseMsg.style.color = "#ffd700";

  const payload = {
    fullName: document.getElementById('fullName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    whatsapp: document.getElementById('whatsapp').value,
    gender: document.getElementById('gender').value,
    location: document.getElementById('location').value,
    motivation: document.getElementById('motivation').value
  };

  try {
    const response = await fetch('/api/student/register', {
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
    console.error("Error submitting form:", error);
    responseMsg.style.color = "#ff8080";
    responseMsg.innerText = "Server connection error.";
  }
});

async function checkRegistration() {
  const query = document.getElementById('lookupInput').value.trim();
  const resultDiv = document.getElementById('lookupResult');

  if (!query) return alert('Please enter your email or registration code.');

  resultDiv.innerHTML = "Searching...";

  try {
    const response = await fetch('/api/student/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const res = await response.json();

    if (response.ok) {
      const data = res.data;
      resultDiv.innerHTML = `
        <div style="background: rgba(224, 180, 79, 0.15); border: 1px solid #ffd700; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <p style="color: var(--gold-primary); font-weight: bold; margin-bottom: 5px;">Registration Found!</p>
          <p><strong>Name:</strong> ${data.fullName}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Registration Code:</strong> <span style="color: #ffd700;">${data.registrationCode}</span></p>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `<p style="color: #ff8080; margin-top: 10px;">${res.error || 'Registration record not found.'}</p>`;
    }
  } catch (error) {
    console.error("Error checking status:", error);
    resultDiv.innerHTML = `<p style="color: #ff8080; margin-top: 10px;">Unable to fetch registration status.</p>`;
  }
}