enum EnvironmentEnum {
    Testnet = "testnet",
    Devnet = "devnet",
    Mainnet = "mainnet",
}

export default EnvironmentEnum;

export type Inspir3DataNFTMinterConfig = {
    environment: EnvironmentEnum;
    minterVersion: string;
    pemFilePath: string;
    preferredMinterAddress?: string;
    howManyToMint: number;
    newCollectionName:string;
    newCollectionTicker: string;
    enabledAntiSpamTax: boolean;
    generatePrivateDatastreamURL: (index: number) => string;
    generatePreviewDatastreamURL: (index: number) => string;
    generateImageURL: (index: number) => string;
    generateTraitsURL: (index: number) => string;
    generateTokenName: (index: number) => string;
    generateDatasetTitle: (index: number) => string;
    generateDatasetDescription: (index: number) => string;
}

type ContractOptions = {
    useLatest: true;
};

type ContractOptionsWithLatest = ContractOptions & {
    preferredContractAddress?: never;
};

type ContractOptionsWithPreferred = {
    useLatest: false;
    preferredContractAddress: string;
};

type ContractOptionsWithNew = {
    deployNew: true;
};

export type ContractOptionsUnion = ContractOptionsWithLatest | ContractOptionsWithPreferred | ContractOptionsWithNew;
