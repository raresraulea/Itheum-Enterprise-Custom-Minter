import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { NftMinter } from "@itheum/sdk-mx-data-nft/out";
import { Factory, DeployedContract } from "@itheum/sdk-mx-enterprise/out";
import { UserSecretKey, UserSigner } from "@multiversx/sdk-wallet/out";
import { Account, Address, Transaction } from '@multiversx/sdk-core/out';
import * as fs from 'fs';
import { UserAddress } from '@multiversx/sdk-wallet/out/userAddress';
import EnvironmentEnum, { ContractOptionsUnion, Inspir3DataNFTMinterConfig } from './types';



export const DEFAULT_CONFIG: Inspir3DataNFTMinterConfig  = {
    pemFilePath: '',
    minterVersion: '',
    howManyToMint: 1,
    newCollectionName: '',
    newCollectionTicker: '',
    enabledAntiSpamTax: false,
    preferredMinterAddress: '',
    environment: EnvironmentEnum.Devnet,
    generateImageURL: (index: number) => '',
    generateTraitsURL: (index: number) => '',
    generateTokenName: (index: number) => '',
    generateDatasetTitle: (index: number) => '',
    generateDatasetDescription: (index: number) => '',
    generatePreviewDatastreamURL: (index: number) => '',
    generatePrivateDatastreamURL: (index: number) => '',
};

export class Inspir3DataNFTMinter {
    private apiUrl: string;
    private factory: Factory;
    private signer: UserSigner;
    private pemFilePath: string;
    private nftMinter!: NftMinter;
    private ownerAddress: Address;
    private minterVersion: string;
    private howManyToMint: number = 1;
    private environment: EnvironmentEnum;
    private preferredMinterAddress: string;
    private newCollectionName: string = "";
    private newCollectionTicker: string = "";
    private nftMinterDeployerAccount: Account;
    private enabledAntiSpamTax: boolean = false;
    private networkProvider: ApiNetworkProvider;
    private nftMinterDeployerAddress: UserAddress;
    private deployedContracts: DeployedContract[] = [];
    private generateImageURL: (index: number) => string;
    private generateTraitsURL: (index: number) => string;
    private generateTokenName: (index: number) => string;
    private generateDatasetTitle: (index: number) => string;
    private generateDatasetDescription: (index: number) => string;
    private generatePreviewDatastreamURL: (index: number) => string;
    private generatePrivateDatastreamURL: (index: number) => string;

    constructor(config: Inspir3DataNFTMinterConfig = DEFAULT_CONFIG) {
        this.environment = config.environment || EnvironmentEnum.Devnet;
        this.minterVersion = config.minterVersion || '';
        this.pemFilePath = config.pemFilePath || '';
        this.howManyToMint = config.howManyToMint || 1;
        this.newCollectionName = config.newCollectionName || '';
        this.newCollectionTicker = config.newCollectionTicker || '';
        this.enabledAntiSpamTax = config.enabledAntiSpamTax || false;
        this.preferredMinterAddress = config.preferredMinterAddress || '';
        this.generateImageURL = config.generateImageURL;
        this.generateTraitsURL = config.generateTraitsURL;
        this.generateTokenName = config.generateTokenName;
        this.generateDatasetTitle = config.generateDatasetTitle;
        this.generateDatasetDescription = config.generateDatasetDescription;
        this.generatePreviewDatastreamURL = config.generatePreviewDatastreamURL;
        this.generatePrivateDatastreamURL = config.generatePrivateDatastreamURL;

        this.apiUrl = this.environment === EnvironmentEnum.Mainnet
            ? 'https://api.multiversx.com'
            : 'https://devnet-api.multiversx.com';

        this.factory = new Factory(this.environment);
        this.networkProvider = new ApiNetworkProvider(this.apiUrl, { timeout: 10000 });

        const nftMinterDeployerPem = fs.readFileSync(this.pemFilePath);
        const nftMinterDeployer = UserSecretKey.fromPem(nftMinterDeployerPem.toString());
        this.nftMinterDeployerAddress = nftMinterDeployer.generatePublicKey().toAddress();
        this.nftMinterDeployerAccount = new Account(this.nftMinterDeployerAddress);
        this.ownerAddress = new Address(this.nftMinterDeployerAddress.bech32());
        this.signer = new UserSigner(nftMinterDeployer);
    }


    async sendTransactions(txs: Transaction[]) {
        try {
            const nftMinterDeployerAccount = new Account(this.ownerAddress);
            const nftMinterDeployerAccountOnNetwork = await this.networkProvider.getAccount(this.ownerAddress);
            nftMinterDeployerAccount.update(nftMinterDeployerAccountOnNetwork);
            const txsToSend: Transaction[] = [];

            for (const tx of txs) {
                const nonce = nftMinterDeployerAccount.getNonceThenIncrement();
                console.log({ nonce });
                tx.setNonce(nonce);
                tx.setSender(this.ownerAddress);
                const signature = await this.signer.sign(tx.serializeForSigning() as any);
                tx.applySignature(signature as any);
                txsToSend.push(tx);
            }

            const results = await this.networkProvider.sendTransactions(txsToSend);

            return results;
        } catch (error) {
            console.error(error);
        }
    }

    async deployMinterContract() {
        try {
            console.log("Deploying minter contract...");
            const tx = this.factory.deployContract(
                this.ownerAddress,
                this.minterVersion
            );
            
            const results = await this.sendTransactions([tx]);
            
            await this.fetchDeployedContracts();

            const minterSCAddressToWorkWith = new Address(this.preferredMinterAddress)
                ? this.preferredMinterAddress
                : this.deployedContracts?.[0].address;

            const deployedMinterContractAddress = new Address(minterSCAddressToWorkWith);

            this.nftMinter = new NftMinter(this.environment, deployedMinterContractAddress);
        } catch (e) {
        console.error(e);
        }
    }

    async initializeSmartContract() {
        try {
            console.log("Initializing Smart Contract...");
            const txToIssue = this.nftMinter.initializeContract(
                this.ownerAddress,
                this.newCollectionName,
                this.newCollectionTicker,
                0,
                this.enabledAntiSpamTax,
                this.ownerAddress
            );

            txToIssue.setGasLimit(100000000);

            // return txToIssue;
                
            await this.sendTransactions([txToIssue]);
        } catch (e) {
        console.log("_enterpriseDeployNewMinterContract has FAILED");
        console.error(e);
        }
    }

    async setRoles() {
        try {
            await this.syncAccount();
            const txToIssue = this.nftMinter.setLocalRoles(this.ownerAddress);
            return txToIssue;
            // await this.sendTransactions([txToIssue]);

        } catch (e) {
            console.error(e);
        }
    }

    async unpauseContractIfPaused() {
        try {
            const isPaused = await this.nftMinter.viewContractPauseState();
            if (isPaused) {
                await this.syncAccount();
                const txToIssue = this.nftMinter.unpauseContract(this.ownerAddress);
                return txToIssue;
                // await this.sendTransactions([txToIssue]);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async isWhitelisted() {
        const promises = [
            this.factory.viewAddressIsWhitelisted(this.ownerAddress),
            this.factory.viewWhitelistEnabledState(),
        ];
        const [isAddressWhitelisted, isWhitelistingEnabled] = await Promise.all(promises);

        return {
            isAddressWhitelisted, 
            isWhitelistingEnabled,
        };
    }

    async whitelistMe() {
        try {
        const addressesToWhitelist = [this.ownerAddress.bech32()]; 
        const addressStringsToArray = addressesToWhitelist;
        await this.syncAccount();
        const txToIssue = this.nftMinter.whitelist(this.ownerAddress, addressStringsToArray);
        return txToIssue;

        // await this.sendTransactions([txToIssue]);
        } catch (e) {
            console.error(e);
        }
    }

    async mintNFTs() {
        try {
            console.log('Minting NFTs...');
            const txsToSend = [];
            const nftMinterDeployerAccount = new Account(this.ownerAddress);
            const nftMinterDeployerAccountOnNetwork = await this.networkProvider.getAccount(this.ownerAddress);
            nftMinterDeployerAccount.update(nftMinterDeployerAccountOnNetwork);

            for (let i = 0; i < this.howManyToMint; i++) {
                const tx = await this.nftMinter.mint(
                    this.nftMinterDeployerAddress,
                    this.generateTokenName(i),
                    'https://api.itheumcloud-stg.com/datamarshalapi/router/v1',
                    this.generatePrivateDatastreamURL(i),
                    this.generatePreviewDatastreamURL(i),
                    0,
                    this.generateDatasetTitle(i),
                    this.generateDatasetDescription(i),
                    {
                        imageUrl: this.generateImageURL(i),
                        traitsUrl: this.generateTraitsURL(i),
                    },
                );
                tx.setNonce(nftMinterDeployerAccount.getNonceThenIncrement());
                const signature = await this.signer.sign(tx.serializeForSigning());
                tx.applySignature(signature);
                txsToSend.push(tx);
            }

            await this.networkProvider.sendTransactions(txsToSend);
        } catch (error) {
            console.error(error);
        }
        
    }
    
    async fetchDeployedContracts() {
        this.deployedContracts = await this.factory.viewAddressContracts(this.ownerAddress);
        return this.deployedContracts;
    }

    public getDeployedContracts() {
        return this.deployedContracts;
    }

    public setPreferredMinterAddress(address: string) {
        this.preferredMinterAddress = address;
        this.nftMinter = new NftMinter(this.environment, new Address(address));
    }

    async syncAccount() {
        this.nftMinterDeployerAccount = new Account(this.nftMinterDeployerAddress);
        const nftMinterDeployerAccountOnNetwork = await this.networkProvider.getAccount(
            this.nftMinterDeployerAddress,
        );
        this.nftMinterDeployerAccount.update(nftMinterDeployerAccountOnNetwork);
    }

    useLatestDeployedContractIfExists() {
        const myContracts = this.getDeployedContracts();

        if (!myContracts || myContracts.length === 0)
            return false;

        this.setPreferredMinterAddress(myContracts[myContracts.length - 1].address);
        return true;
    }

    async canUseAddress(address: string) {
        try {
            if (!address || address.length === 0 || !(new Address(address)))
                return false;
            const contracts = await this.fetchDeployedContracts();
            return contracts.map(c => c.address).includes(address);
        } catch (e) {
            console.error(e);
        }
    }

    async configureContractAndMint({ waitForDeploy }: { waitForDeploy: boolean }) {
        
        const handler = async () => {

            await this.initializeSmartContract();

            setTimeout(async () => {
                const transactions: (Transaction | undefined)[] = await Promise.all([
                    this.setRoles(),
                    this.whitelistMe(),
                    this.unpauseContractIfPaused(),
                ]);

                const nftMinterDeployerAccount = new Account(this.ownerAddress);
                const nftMinterDeployerAccountOnNetwork = await this.networkProvider.getAccount(this.ownerAddress);
                nftMinterDeployerAccount.update(nftMinterDeployerAccountOnNetwork);

                const txsToSend = transactions.filter(t => !!t) as Transaction[];
                const signedTransactions = [];

                for (let i = 0; i < txsToSend.length; i++) {
                    const tx = txsToSend[i];
                    tx.setNonce(nftMinterDeployerAccount.getNonceThenIncrement());
                    const signature = await this.signer.sign(tx.serializeForSigning());
                    tx.applySignature(signature);
                    signedTransactions.push(tx);
                }

                await this.networkProvider.sendTransactions(signedTransactions);

                setTimeout(async () => { 
                    await this.mintNFTs();
                }, 60000);
            }, 60000);
        };

        if (waitForDeploy) {
            setTimeout(handler, 60_000);
        } else {
            await handler();
        }
            
    }

    async useExistingContractOrDeployNew(options: ContractOptionsUnion) {
        if ('useLatest' in options && options.useLatest && options.useLatest === true) {
            if (!this.useLatestDeployedContractIfExists()) {
                await this.deployMinterContract();
                this.useLatestDeployedContractIfExists();
            }
        } else if ('preferredContractAddress' in options) {
            if (await this.canUseAddress(options.preferredContractAddress)) {
                this.setPreferredMinterAddress(options.preferredContractAddress);
            }
        } else if ('deployNew' in options && options.deployNew) {
            console.log("Deploying new contract!");
            await this.deployMinterContract();
            this.useLatestDeployedContractIfExists();
        }
    }
    
}
