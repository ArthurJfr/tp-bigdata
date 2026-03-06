const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { ApiKeyCredentials } = require('@azure/ms-rest-js');

const getAzureClient = () => {
  const { AZURE_VISION_ENDPOINT, AZURE_VISION_KEY } = process.env;

  if (!AZURE_VISION_ENDPOINT || !AZURE_VISION_KEY) {
    throw new Error('Variables AZURE_VISION_ENDPOINT et AZURE_VISION_KEY manquantes');
  }

  const credentials = new ApiKeyCredentials({
    inHeader: { 'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY },
  });

  return new ComputerVisionClient(credentials, AZURE_VISION_ENDPOINT);
};

module.exports = { getAzureClient };
