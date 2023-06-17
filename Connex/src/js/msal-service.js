const metas = document.getElementsByTagName('meta');

function navigateToMarketPoint() {
    const userHint = sessionStorage.getItem('login-hint');
    const tenant = '3e20ecb2-9cb0-4df1-ad7b-914e31dcdda4';

    window.location.href = `https://icy-grass-0a043be0f.3.azurestaticapps.net\\?userhint=${userHint}&tenant=${tenant}`

}

async function getUrlParameters() {
    const params = (new URL(window.location.href)).searchParams;
    return params;
}


const language = window.navigator.languages[0];

// Msal
const MSAL = window.msal;
const clientId = () => getMetatag('clientId');
const scope = () => getMetatag('apiScope');
const scopes = [scope()];
const accessTokenRequest = {
    scopes: scopes
};

const msalConfig = {
    auth: {
        clientId: clientId(),
        redirectUri: `${window.location.origin}/index.html`,
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


    sessionStorage.setItem('clientId', clientId());
    localStorage.clear();

    this.account = msalInstance.getAllAccounts()[0] || null;

    if (this.account) {
        accessTokenRequest.account = this.account;
        await msalInstance.acquireTokenSilent(accessTokenRequest)
            .then((accessToken) => {
                return processAccessToken(accessToken);
            })
            .then((userProperties) => {
                if (userProperties.userId !== null || userProperties.userEmail !== undefined) {
                    // initConnexLogin(userProperties);
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

msalInstance.handleRedirectPromise()
    .then((accessToken) => {
        if (accessToken !== null) {
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
    await getUserPrincipalName(prop)
        .then(userPrincipalName => {
            if (userPrincipalName['upn'] !== undefined) {
                sessionStorage.setItem('upn', userPrincipalName.upn);
                window.location.href = `${window.location.origin}/home.html`
            }
            else {
                throw error;
            }
        })
        .catch(error => {
            console.log(error);
            sessionStorage.clear();
        })
}