/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

const catchAsync = require('./../../utils/catchAsync');


//export const updateData = async (name, email) => {
export const updateData = async (data) => {
  try {
    console.log('User Name Is: ', process.env.BASE_URL);

    //const updateDataUrl = `${process.env.BASE_URL}/api/v1/users/updateMe`;
    const updateDataUrl = 'http://127.0.0.1:3000/api/v1/users/updateMe';
    // showAlert('error', `${axios.toString()}`);
    const res = await axios({
      method: 'PATCH',
      url: updateDataUrl,
      data/*: {
        name,
        email
      }*/
    });

    if (res.data.status === 'success') {
      showAlert('success', `Data Updated Successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const updatePassword = async (data) => {
  try {
    //const updatePasswordUrl = `${process.env.BASE_URL}/api/v1/users/updateMyPassword`;
    const updatePasswordUrl = `http://127.0.0.1:3000/api/v1/users/updateMyPassword`;
    const res = await axios({
      method: 'PATCH',
      url: updatePasswordUrl,
      data
    });
    if (res.data.status === 'success') {
      showAlert('success', `Password Updated Successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
