// Адрес Google Apps Script (веб-приложение), куда отправляются заявки.
const ORDER_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwxHl0cEMOI8l30Uk41w2v6Xrxl7nSuBhTnHKpVRF8-4N_Jj1X0Sr95yPZ_sPW7peNb/exec';

const FIELD_MESSAGES = {
  name: 'Напишите, как к вам обращаться',
  contact: 'Укажите телефон или ник, чтобы мы могли связаться',
  idea: 'Опишите, какую игрушку хотите',
};

function setFieldError(form, fieldName, message) {
  const field = form.elements[fieldName];
  const errorEl = document.getElementById(fieldName + '-error');
  if (!field || !errorEl) return;

  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    field.setAttribute('aria-invalid', 'true');
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
    field.removeAttribute('aria-invalid');
  }
}

function setupOrderForm() {
  const form = document.getElementById('order-form');
  if (!form) return;

  const status = document.getElementById('order-status');
  const success = document.getElementById('order-success');
  const submitButton = form.querySelector('button[type="submit"]');

  function showStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('error', Boolean(isError));
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = form.elements.name.value.trim();
    const contact = form.elements.contact.value.trim();
    const idea = form.elements.idea.value.trim();

    // Проверка полей
    const errors = {
      name: name.length >= 2 ? '' : FIELD_MESSAGES.name,
      contact: contact.length >= 5 ? '' : FIELD_MESSAGES.contact,
      idea: idea.length >= 5 ? '' : FIELD_MESSAGES.idea,
    };

    let firstInvalid = null;
    Object.keys(errors).forEach((fieldName) => {
      setFieldError(form, fieldName, errors[fieldName]);
      if (errors[fieldName] && !firstInvalid) {
        firstInvalid = form.elements[fieldName];
      }
    });

    if (firstInvalid) {
      showStatus('', false);
      firstInvalid.focus();
      return;
    }

    // Ловушка для ботов: заполненное скрытое поле — тихий успех без отправки
    if (form.elements.website.value) {
      form.hidden = true;
      success.hidden = false;
      success.focus();
      return;
    }

    if (!ORDER_ENDPOINT) {
      console.warn('ORDER_ENDPOINT не задан');
      showStatus('Отправка заявок пока не подключена.', true);
      return;
    }

    showStatus('', false);
    submitButton.disabled = true;
    submitButton.textContent = 'Отправляем…';

    try {
      const response = await fetch(ORDER_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ name, contact, idea, page: location.href }),
      });
      const data = await response.json();

      if (data && data.ok === true) {
        form.hidden = true;
        success.hidden = false;
        success.focus();
        return;
      }
      throw new Error('Отправка не удалась');
    } catch (error) {
      showStatus('Не получилось отправить заявку. Попробуйте ещё раз чуть позже.', true);
      submitButton.disabled = false;
      submitButton.textContent = 'Отправить заявку';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Увеличение фото в одном общем окне.
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeButton = document.getElementById('lightbox-close');

  document.querySelectorAll('.js-zoom').forEach((button) => {
    button.addEventListener('click', () => {
      const img = button.querySelector('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.showModal();
    });
  });

  closeButton.addEventListener('click', () => lightbox.close());

  // Клик по фону (вне фото) тоже закрывает окно. Esc закрывает его встроенно.
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      lightbox.close();
    }
  });

  setupOrderForm();
});
