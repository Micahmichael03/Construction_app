// Configuration file - keep this separate from main script
const CONFIG = {
    //  Uncomment this part
    // AZURE_API_KEY: "",
    // AZURE_ENDPOINT: "",
    // AZURE_DEPLOYMENT: "",
    API_BASE_URL: 'https://grumpy-adults-think.loca.lt'  // here change to http://localhost:8000 for local testing or the localtunning 
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}  