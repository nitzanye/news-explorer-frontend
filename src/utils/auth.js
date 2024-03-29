const BASE_URL = 'https://api.news-nitzan.students.nomoredomainssbs.ru';

const handleResponse = (res) => 
  res.ok ? res.json() : Promise.reject(`Error ${res.status}`);

export const register = ( email, password, name ) => {
  return fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  }).then(handleResponse);
};

export const authorize = ( email, password ) => {
  return fetch(`${BASE_URL}/signin`, {
    method: 'POST',
    headers: {
      Accept: 'application/json', 
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);
};

export const checkUerToken = (token) => {
  return fetch(`${BASE_URL}/users/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
  }).then(handleResponse);
};
