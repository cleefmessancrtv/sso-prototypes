let wait;

warmMsalAuthFunc();

// HTML Elements
const metas = document.getElementsByTagName('meta');
const spinner = document.getElementById('spinner');
const signInButton = document.getElementById('submit-button');
const loginPrompt = document.getElementById('login-prompt');
const loginSalutation = document.getElementById('login-salutation');
const loginSection = document.getElementById('login-panel');
const pageLoadingSection = document.getElementById('loading-panel');

signInButton.style.visibility = 'hidden';

const language = window.navigator.languages[0];

// Msal
const MSAL = window.msal;
const clientId = () => getMetatag('clientId');
const scope = () => getMetatag('apiScope');
const canUseMsalAuth = () => JSON.parse(getMetatag('use-msal-auth'));
const canUseMsalSignout = () => JSON.parse(getMetatag('use-msal-signout'));
const scopes = [scope()];
const accessTokenRequest = {
    scopes: scopes
};

const msalConfig = {
    auth: {
        clientId: clientId(),
        redirectUri: window.location.origin + '/msal.html',
        authority: 'https://login.microsoftonline.com/3e20ecb2-9cb0-4df1-ad7b-914e31dcdda4/',
        navigateToLoginRequestUrl: false
    },
    cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false,
        secureCookie: false
    },
    system: {
        tokenRenewalOffsetSeconds: 60,
        loadFrameTimeout: 0,
        asyncPopups: false
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

const signIn = async function () {

    // loginSection.style.visibility = 'hidden';
    pageLoadingSection.style.visibility = 'visible';

    sessionStorage.setItem('clientId', clientId());
    sessionStorage.setItem('use-msal-signout', canUseMsalSignout());
    localStorage.clear();

    if (canUseMsalAuth()) {

        loginSection.stylevisibility = 'visible';
        pageLoadingSection.style.visibility = 'hidden';

        setLoginInProgress();
        this.account = msalInstance.getAllAccounts()[0] || null;

        if (this.account) {
            accessTokenRequest.account = this.account;
            await msalInstance.acquireTokenSilent(accessTokenRequest)
                .then((accessToken) => {
                    return processAccessToken(accessToken);
                })
                .then((userProperties) => {
                    if (userProperties.userId !== null || userProperties.userEmail !== undefined) {
                        initConnexLogin(userProperties);
                    }
                })
                .catch((error) => {
                    sessionStorage.clear();
                    if (error) {
                        msalInstance.loginRedirect({
                            scopes: scopes,
                        });
                    }
                })

        } else {
            await msalInstance.loginRedirect({
                scopes: scopes,
            });
        }
    }

    else {
        loginSection.style.visibility = 'hidden';
        pageLoadingSection.style.visibility = 'visible';
        window.location.href = window.location.origin + '/#/'
    }

}

msalInstance.handleRedirectPromise()
    .then((accessToken) => {
        if (accessToken !== null) {
            setLoginInProgress();
            return processAccessToken(accessToken);
        }
    })
    .then((prop) => {
        if (prop.userId !== null || prop.userEmail !== undefined) {
            initConnexLogin(prop);
        }
    })
    .catch((error) => {
    })



function getMetatag(tagName) {
    if (metas.length > 0) {
        for (let i = 0; i < metas.length; i++) {
            const tagStatus = metas[i].content;

            if (metas[i].getAttribute('name') === tagName) {
                if (tagName === 'use-msal-auth') {
                    sessionStorage.setItem('use-msal-auth', tagStatus);
                }
                return metas[i].getAttribute('content');
            }
        }
    }
    return '';
};

function processAccessToken(accessToken) {
    localStorage.setItem("auth-in-progress", true);

    sessionStorage.setItem('Authorization', 'Bearer ' + accessToken['accessToken']);
    sessionStorage.setItem('login-hint', accessToken['account']['idTokenClaims']['login_hint']);
    sessionStorage.setItem('home-account-id', accessToken['account']['homeAccountId']);

    const userProps = { 'userId': accessToken['account']['idTokenClaims']['oid'], 'userEmail': accessToken['account']['idTokenClaims']['preferred_username'] };
    return userProps;
}

async function initConnexLogin(prop) {
    setLoginInProgress();
    await getUserPrincipalName(prop)
        .then(userPrincipalName => {
            if (userPrincipalName['upn'] !== undefined) {
                sessionStorage.setItem('upn', userPrincipalName.upn);
                window.location.href = 'https://vs-pioneer.visualstudio.com/project0/_boards/board/t/DevOps/Backlog%20items?System.AssignedTo=cleef.messan%40corteva.com';
            }
            else {
                throw error;
            }
        })
        .catch(error => {
            console.log(error);
            sessionStorage.clear();
            setLoginDefault();
        })
}

async function getUserPrincipalName({ userId, userEmail }) {
    setLoginInProgress();
    const requestInit = {
        method: 'GET',
        cache: 'no-cache',
        headers: {
            'upn': userEmail,
            'Authorization': sessionStorage.getItem('Authorization'),
            'Referrer-Policy': 'no-referrer'
        },
    }

    const request = await fetch(`/api/msal/${userId}/upn`, requestInit)
    const userUPN = await request.json();
    return userUPN;
}

async function getUrlParameters(){
    const params = (new URL(window.location.href)).searchParams;
    return params; 
}

wait = setTimeout(setLoginDefault(), 1500);
