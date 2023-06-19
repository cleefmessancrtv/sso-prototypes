
function getUrlParameters() {
    const param = (new URL(window.location.href)).searchParams;
    return param.get('userhint');
}


// Msal
const userHint = getUrlParameters();
const MSAL = window.msal;
const scopes = ['api://a50bf762-1619-4252-8cd5-0a261d0c631b/ApiAccess'];
const accessTokenRequest = {
    scopes: scopes
};

const msalConfig = {
    auth: {
        clientId: 'cad0ee25-4800-4616-9fe5-afc332a4faf6',
        redirectUri: `${window.location.origin}/msal.html`,
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
        loadFrameTimeout: 90000,
        asyncPopups: false
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

const signIn = async function () {
    localStorage.clear();


    try {
        await msalInstance.ssosilent({
            scopes: scopes,
            loginHint: userHint
        });
    } catch (error) {
        console.log(error);
        console.log("Trying Logging redirect")

        await msalInstance.loginRedirect({
            scopes: scopes,
            loginHint: userHint
        });
    }



}

msalInstance.handleRedirectPromise()
    .then((accessToken) => {

        if (accessToken !== null) {
            processAccessToken(accessToken);
        }
    })

    .catch((error) => {
        console.log(error);
    })


function processAccessToken(accessToken) {
    console.log("Processing Token")
    localStorage.setItem("auth-in-progress", true);

    sessionStorage.setItem('Authorization', 'Bearer ' + accessToken['accessToken']);
    sessionStorage.setItem('login-hint', accessToken['account']['idTokenClaims']['login_hint']);
    sessionStorage.setItem('home-account-id', accessToken['account']['homeAccountId']);
    sessionStorage.setItem('upn', accessToken['account']['username']);


    // const userProps = { 'userId': accessToken['account']['idTokenClaims']['oid'], 'userEmail': accessToken['account']['idTokenClaims']['preferred_username'] };
    // return userProps;
    window.location.href = window.location.origin + '/home';
}

signIn();