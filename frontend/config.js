// Configuration file - keep this separate from main script
const CONFIG = {
    //  Uncomment this part
    // AZURE_API_KEY: "7mqqgtt8kGk1msrFDOureWrWSERYsnSoqu8MdV87qLMHrpaHlj07JQQJ99BFACHYHv6XJ3w3AAAAACOG682H",
    // AZURE_ENDPOINT: "https://realestateai.openai.azure.com/",
    // AZURE_DEPLOYMENT: "o4-mini",
    API_BASE_URL: 'https://grumpy-adults-think.loca.lt'  // here change to http://localhost:8000 for local testing or the localtunning 
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}  