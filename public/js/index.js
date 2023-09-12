import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateData, updatePassword } from './updateSettings';
import { bookTour } from './stripe';


//DOM elements
const mapbox = document.getElementById('map');
const bookBtn = document.getElementById('book-tour');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');


// Delegation
if (mapbox) {
  const locations = JSON.parse(mapbox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData();
    document.querySelector('.btn--save--settings').textContent = 'Updating...';
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    //await updateData(name, email);
    await updateData(form);
    document.querySelector('.btn--save--settings').textContent = 'Save settings';
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async event => {
    event.preventDefault();
    document.querySelector('.btn--save--password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    const dataObj = {
      passwordCurrent,
      password,
      passwordConfirm
    };
    await updatePassword(dataObj);

    document.querySelector('.btn--save--password').textContent = 'SAVE PASSWORD';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}


if (bookBtn) {
  bookBtn.addEventListener('click', event => {
    event.target.textContent = 'Processing...';

    //const tourId = event.target.dataset.tourId;
    const { tourId } = event.target.dataset;
    bookTour(tourId);
  });
}