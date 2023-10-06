# Data NFT Minter

The Data NFT Minter is a TypeScript script that enables users to mint Data NFTs on the MultiversX platform using the Itheum Data NFTs Enterprise SDK. This documentation provides a concise guide on how to use the minter script and details the available configuration options.

## Getting Started

1. **Clone the Repository**: Begin by cloning this GitHub repository to your local environment.

2. **Install Dependencies**: Ensure that you have Node.js installed, then run the following command to install the necessary dependencies:

   ```bash
   npm install
   ```

3. **Configure the Script**: Modify the configuration options in the script according to your specific requirements. The available configuration options are detailed below.

4. **Run the Minter**: Execute the script to deploy contracts and mint Data NFTs.

   ```bash
   npm start
   ```

## Configuration Options

The minter script offers various configuration options that allow you to customize the behavior of the NFT minting process. These options can be set in the `ataNFTMinterConfig` object provided when creating an instance of the `ataNFTMinter` class.

### Available Configuration Options

- **`pemFilePath`**: Path to the PEM file containing authentication credentials.
- **`minterVersion`**: Version of the minter.
- **`howManyToMint`**: Number of NFTs to mint.
- **`newCollectionName`**: Name of the new NFT collection.
- **`newCollectionTicker`**: Ticker for the new NFT collection.
- **`enabledAntiSpamTax`**: Enable or disable anti-spam tax.
- **`preferredMinterAddress`**: Preferred minter address.
- **`environment`**: Environment type (e.g., Devnet or Mainnet).

### Customization Functions

- **`generateImageURL`**: Function to generate image URLs for NFTs.
- **`generateTraitsURL`**: Function to generate traits URLs for NFTs.
- **`generateTokenName`**: Function to generate token names for NFTs.
- **`generateDatasetTitle`**: Function to generate dataset titles for NFTs.
- **`generateDatasetDescription`**: Function to generate dataset descriptions for NFTs.
- **`generatePreviewDatastreamURL`**: Function to generate preview datastream URLs for NFTs.
- **`generatePrivateDatastreamURL`**: Function to generate private datastream URLs for NFTs.

## Usage Example

Here's an example of how to use the minter script with custom configuration options:

```javascript
void (async () => {
    const customMinter = await (new interFactory()).createMinter({
        environment: EnvironmentEnum.Devnet,
        minterVersion: '0.0.1',
        pemFilePath: '/path/to/pem/file.pem',
        howManyToMint: 5,
        newCollectionName: 'I3TESTCOL',
        newCollectionTicker: 'I3TESTTCK',
        enabledAntiSpamTax: false,
        generateImageURL: (i) => `https://example.com/image-${i}.png`,
        generateTraitsURL: (i) => `https://example.com/traits-${i}.json`,
        generateTokenName: (i) => `INSPIRE${i}`,
        generateDatasetTitle: (i) => `Title${i}`,
        generateDatasetDescription: (i) => `description ${i}`,
        generatePreviewDatastreamURL: (i) => 'https://example.com/preview.png',
        generatePrivateDatastreamURL: (i) => `https://example.com/private-data-${i}.json`,
    });

    await customMinter.useExistingContractOrDeployNew({
        deployNew: true,
    });

    await customMinter.configureContractAndMint({ waitForDeploy: true });

    console.log("Done!");
})();
```

Customize the configuration options as needed for your specific use case, and follow the provided usage example to mint Data NFTs.
