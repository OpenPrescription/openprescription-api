const apigClientFactory = require("aws-api-gateway-client").default;

export default class AwsApiGateway {
  constructor(apiId) {
    this.client = apigClientFactory.newClient({
      invokeUrl: `https://${apiId}.execute-api.${process.env.AWS_REGION}.amazonaws.com`, // REQUIRED

      region: process.env.AWS_REGION, // REQUIRED: The region where the API is deployed.

      accessKey: process.env.AWS_API_GATEWAY_ACCESS_KEY, // REQUIRED

      secretKey: process.env.AWS_API_GATEWAY_SECRET_KEY, // REQUIRED
    });
  }

  post(path, body = {}, additionalParams = {}) {
    return this.client.invokeApi({}, path, "POST", additionalParams, body);
  }

  get(path, query = {}, additionalParams = {}) {
    additionalParams = {
      queryParams: query,
    };
    return this.client.invokeApi({}, path, "GET", additionalParams, {});
  }
}
