import  { Inspir3DataNFTMinter } from './Inspir3DataNFTMinter';
import { Inspir3MinterFactory } from './Inspir3MinterFactory';
import EnvironmentEnum from './types';

void (async () => {
    const customMinter = await (new Inspir3MinterFactory()).createMinter({
        environment: EnvironmentEnum.Devnet,
        minterVersion: '0.0.1',
        pemFilePath: '/Users/Rares/Sites/Personal/mx-sdk-js-native-auth-client/src/david.pem',
        howManyToMint: 5,
        newCollectionName: 'I3TESTCOL',
        newCollectionTicker: 'I3TESTTCK',
        enabledAntiSpamTax: false,
        generateImageURL: (i: number) => `https://api.itheumcloud-stg.com/datadexapi/bespoke/dynamicImageDemo/GIFTX_ED_${i}`,
        generateTraitsURL: (i: number) => `https://api.itheumcloud-stg.com/datadexapi/bespoke/dynamicMetadataDemo/GIFTX_ED_${i}`,
        generateTokenName: (i: number) => `INSPIRE${i}`,
        generateDatasetTitle: (i: number) => `INSPIR3 Title${i}`,
        generateDatasetDescription: (i: number) => `INSPIR3 description ${i}`,
        generatePreviewDatastreamURL: (i: number) => 'https://raw.githubusercontent.com/Itheum/data-assets/main/Misc/Random/nopreview.png',
        generatePrivateDatastreamURL: (i: number) => 'https://api.itheumcloud-stg.com/datadexapi/bespoke/dynamicSecureDataStreamDemo',
    });

    await customMinter.useExistingContractOrDeployNew({
        deployNew: true,
    });

    await customMinter.configureContractAndMint({ waitForDeploy: true });

    console.log("Done!");
})();
