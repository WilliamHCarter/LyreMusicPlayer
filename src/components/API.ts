
const CLIENT_ID = '';
const CLIENT_SECRET = '';

const getAccessToken = async () => {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            body: new URLSearchParams({
                grant_type: 'client_credentials',
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
            },
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error retrieving access token:', error);
        throw error;
    }
};

export default getAccessToken;