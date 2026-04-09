const listContainer = document.getElementById('turbinesList');
const form = document.getElementById('turbineForm');
const messageDiv = document.getElementById('message');

document.addEventListener('DOMContentLoaded', loadData);
const allInputs = form.querySelectorAll('input, select');
allInputs.forEach(input => {
    input.addEventListener('invalid', () => {
        input.setCustomValidity('Будь ласка, заповніть це поле');
    });
    input.addEventListener('input', () => {
        input.setCustomValidity('');
    });
});
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    if (!data.name || !data.coords || !data.power || !data.count) {
        return showNotification('error', '⚠️ Заповніть усі обов’язкові поля!');
    }
    try {
        const res = await fetch('/api/turbines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok && result.success) {
            form.reset();
            await loadData(); 
            showNotification('success', 'Турбіну додано в реєстр!');
        } else {
            showNotification('error', result.message || 'Помилка збереження');
        }
    } catch (err) {
        console.error('Помилка відправки:', err);
        showNotification('error', 'Сервер недоступний');
    }
});
async function loadData() {
    try {
        listContainer.style.opacity = '0.5';
        const res = await fetch('/api/turbines');
        if (!res.ok) throw new Error('Не вдалося отримати дані');
        
        const items = await res.json();
        renderList(items);
        listContainer.style.opacity = '1';
    } catch (err) {
        console.error('Помилка завантаження:', err);
        listContainer.innerHTML = '<p class="error-msg">Помилка завантаження бази даних</p>';
    }
}
function renderList(items) {
    if (!items || items.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <p>📭 Реєстр порожній. Додайте першу установку.</p>
            </div>
        `;
        return;
    }
    listContainer.innerHTML = items.map(i => {
        const cleanCoords = i.coords.replace(/\s/g, '');
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${cleanCoords}`;

        return `
            <div class="consumer-card" id="card-${i.id}">
                <div class="card-header">
                    <h3>📍 ${i.name}</h3>
                    <span class="badge">${i.type === 'horizontal' ? 'Горизонтальний-тип' : 'Вертикальний-тип'}</span>
                </div>
                <div class="card-body">
                    <div class="info-row"><span>Координати:</span> <strong>${i.coords}</strong></div>
                    <div class="info-row"><span>Потужність (од):</span> <strong>${i.power} МВт</strong></div>
                    <div class="info-row"><span>Кількість:</span> <strong>${i.count} шт.</strong></div>
                    <div class="info-row total-highlight">
                        <span>ЗАГАЛЬНА ПОТУЖНІСТЬ:</span> 
                        <strong>${(Number(i.power) * Number(i.count)).toFixed(1)} МВт</strong>
                    </div>
                    <div class="info-row mini"><span>Висота:</span> <strong>${i.height || 0} м</strong></div>
                    <div class="info-row mini"><span>Діаметр:</span> <strong>${i.diameter || 0} м</strong></div>
                </div>
                <div class="card-actions">
                    <a href="${mapUrl}" target="_blank" class="btn-map">🗺 Карта</a>
                    <button class="btn-delete" onclick="deleteItem('${i.id}')">🗑 Видалити</button>
                </div>
            </div>
        `;
    }).join('');
}
async function deleteItem(id) {
    if (!confirm('Видалити цей об’єкт?')) return;
    try {
        const response = await fetch(`/api/turbines/${id}`, { 
            method: 'DELETE' 
        });
        if (response.ok) {
            loadData();
            showNotification('success', 'Об’єкт видалено');
        } else {
            showNotification('error', 'Не вдалося видалити');
        }
    } catch (err) {
        showNotification('error', 'Помилка зв’язку з сервером');
    }
}
function showNotification(type, text) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 4000);
}