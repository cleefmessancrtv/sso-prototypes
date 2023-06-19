
async function getUrlParameters() {
    const userHint = (new URL(window.location.href)).searchParams;
    console.log(userHint)
    return userHint;
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
        clientId: '3e20ecb2-9cb0-4df1-ad7b-914e31dcdda4',
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
        await msalInstance.ssoSilent({
            scopes: scopes,
            loginHint: userHint,
            domainHint: '3e20ecb2-9cb0-4df1-ad7b-914e31dcdda4'
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
    })


function processAccessToken(accessToken) {
    localStorage.setItem("auth-in-progress", true);

    sessionStorage.setItem('Authorization', 'Bearer ' + accessToken['accessToken']);
    sessionStorage.setItem('login-hint', accessToken['account']['idTokenClaims']['login_hint']);
    sessionStorage.setItem('home-account-id', accessToken['account']['homeAccountId']);

    // const userProps = { 'userId': accessToken['account']['idTokenClaims']['oid'], 'userEmail': accessToken['account']['idTokenClaims']['preferred_username'] };
    // return userProps;
    window.location.href = window.location.origin + '/home/';
}
