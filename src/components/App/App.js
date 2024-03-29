import React, { useCallback } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Main from '../Main/Main';
import newsApi from '../../utils/NewsApi';
import mainApi from '../../utils/MainApi';
import * as auth from '../../utils/auth';
import SavedNews from '../SavedNews/SavedNews';
import Footer from '../Footer/Footer';
import Login from '../Login/Login';
import InfoTooltip from '../InfoTooltip/InfoTooltip';
import Register from '../Register/Register';
import { CurrentUserContext } from '../../contexts/CurrentUserContext';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';
import './App.css';

const App = () => {

  const [loggedIn, setLoggedIn] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState({});
  const [currentName, setCurrentName] = React.useState({} || '');

  const [isLoginPopupOpen, setIsLoginPopupOpen] = React.useState(false);
  const [isRegisterPopupOpen, setIsRegisterPopupOpen] = React.useState(false);
  const [isInfoTooltipOpen, setIsInfoTooltipOpen] = React.useState(false);
 
  // Articles states
  const [isDataLoading, setIsDataLoading] = React.useState(false);
  const [searchSubmit, setSearchSubmit] = React.useState(false);
  
  const [keyword, setKeyword] = React.useState(localStorage.getItem('keyword'));
  const [articles, setArticles] = React.useState(JSON.parse(localStorage.getItem('searchResults')))
  const [savedArticles, setSavedArticles] = React.useState([]);

  
  const navigate = useNavigate();

  React.useEffect(() => {
    loggedIn && 
      mainApi
        .getUserData()
        .then((res) => setCurrentUser(res))
        .catch((err) => console.log(`Error.....: ${err}`));
  }, [loggedIn]);

const getArticles = useCallback(() => {
  loggedIn && 
    mainApi
      .getSavedArticles()
      .then((articlesList) => {
        setSavedArticles(
          articlesList.map((article) => {
            return {
              _id: article._id,
              keyword: article.keyword,
              title: article.title,
              content: article.text,
              publishedAt: article.date,
              source: {name: article.source},
              url: article.link,
              urlToImage: article.image,
              owner: article.owner,
            }
          })
        );
      })
        .catch((err) => console.log(`Error.....: ${err}`));
      }, [loggedIn]);
  
  React.useEffect(() => {
    getArticles();
  } ,[getArticles]);

  // save article of the current user
  const handleSaveArticle = (article) => {
    const isSavedAlready = savedArticles.find((savedArticle) => savedArticle.url === article.url);
    if (isSavedAlready) {
      mainApi
        .deleteArticle(isSavedAlready._id)
        .then(() => getArticles())
        .catch((err) => console.log(`Error......${err}`));
    } else {
      mainApi.createNewArticle({
        keyword: article.keyword,
        title: article.title,
        text: article.content,
        date: article.publishedAt,
        source: article.source.name,
        link: article.url,
        image: article.urlToImage,
      })
    .then(() => getArticles())
    .catch((err) => console.log(`Error......${err}`));
    }
  }

  const handleDeleteArticle = (articleId) => {
    mainApi
      .deleteArticle(articleId)
      .then(() => {
        setSavedArticles((articles) => articles.filter((article) => article._id !== articleId));
      })
      .catch((err) => console.log(`Error...${err}`));
  }

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      auth
        .checkUerToken(token)
        .then((res) => {
          setCurrentName(res.name);
          setLoggedIn(true);
        })
        .catch((err) => console.log(`Error.....: ${err}`));
    }
  }, []);

  const handleLogOut = () => {
    localStorage.removeItem('token');
    navigate('/');
    setLoggedIn(false);
    setCurrentUser({});
    setCurrentName('Signin');
  };

  const handleSearchSubmit = (query) => {
    setIsDataLoading(true);
    newsApi
      .getRequestNews(query)
      .then((data) => {
        setArticles(data.articles);
        localStorage.setItem('searchResults', JSON.stringify(data.articles));
        setIsDataLoading(false);
        setSearchSubmit(true);
        setKeyword(query);
        localStorage.setItem('keyword', query);
      })
      .catch((err) => console.log(`Error.......: ${err}`))
      .finally(() => setIsDataLoading(false)); 
  };


  const popupOpened = isLoginPopupOpen || isRegisterPopupOpen || isInfoTooltipOpen;
  
  const handleSignup = ({ email, password, name }) => {
    if (!email || !password || !name) {
      return console.log('Error.....');
    }
    auth
      .register(email, password, name)
      .then(() => {
        closeAllPopups();
        setIsInfoTooltipOpen(true);
      })
      .catch((err) => {
        console.log(`Error......: ${err}`);
      })
  };

  const handleSignin = ({ email, password }) => {
    if (!email || !password) {
      return console.log('Error.....');
    }
    auth
    .authorize(email, password)
    .then((data) => {
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        setLoggedIn(true);
        setCurrentName(currentName);
        closeAllPopups();
        return data;
      }
    })
    .catch((err) => {
      console.log(`Error.....: ${err}`);
    });
  };

  const handleLogin = () => {
    closeAllPopups();
    setIsLoginPopupOpen(true);
 }

  const closeAllPopups = () => {
    setIsLoginPopupOpen(false);
    setIsRegisterPopupOpen(false);
    setIsInfoTooltipOpen(false);
  };

  const switchPopup = () => {
    setIsLoginPopupOpen(!isLoginPopupOpen);
    setIsRegisterPopupOpen(!isRegisterPopupOpen);
  }

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className='app'>
        <Routes>
          <Route
            path='/'
            element={
              <>
                <Main 
                currentUser={currentUser}
                onSubmit={handleSearchSubmit} 
                loggedIn={loggedIn}
                onLogin={handleLogin}
                onLogout={handleLogOut}
                onRegister={handleSignup}
                popupOpened={popupOpened}
                isDataLoading={isDataLoading}
                searchSubmit={searchSubmit}
                keyword={keyword}
                articles={articles}
                onSave={handleSaveArticle}
                savedArticles={savedArticles}
                />
              </>
          }
          >
          </Route>
          <Route
            path='/saved-news'
            element={
              <ProtectedRoute redirectPath='/' loggedIn={loggedIn}>
              <>
                <SavedNews 
                  loggedIn={loggedIn}
                  onLogin={handleLogin}
                  onLogout={handleLogOut}
                  currentUser={currentUser}
                  savedArticles={savedArticles}
                  onDelete={handleDeleteArticle}
                />
              </>
              </ProtectedRoute>
            }
          />
          <Route 
              path='*' 
              element={
                <Navigate to='/' />
              }
          />
        </Routes>

        <Login 
          handleSignin={handleSignin} 
          loggedIn={loggedIn} 
          onClose={closeAllPopups} 
          isOpen={isLoginPopupOpen} 
          onSwitchPopup={switchPopup}
        />
        
        <Register 
          handleSignup={handleSignup} 
          loggedIn={loggedIn} 
          onClose={closeAllPopups} 
          isOpen={isRegisterPopupOpen}
          onSwitchPopup={switchPopup}
        />
        
        <InfoTooltip 
          onClose={closeAllPopups}
          isOpen={isInfoTooltipOpen}
          onLoginClick={handleLogin}
          
        />

        <Footer />
      </div>
    </CurrentUserContext.Provider>
  );
};

export default App;
