import { DEFAULT_CONFIG, Inspir3DataNFTMinter } from "./Inspir3DataNFTMinter";
import { Inspir3DataNFTMinterConfig } from "./types";

export class Inspir3MinterFactory {
    private minter: Inspir3DataNFTMinter | null = null;

    async createMinter(minterConfig: Inspir3DataNFTMinterConfig) {
        if (!minterConfig)
            minterConfig = DEFAULT_CONFIG;
        else {
            minterConfig = {
                ...DEFAULT_CONFIG,
                ...minterConfig,
            }; 
        }
        this.minter = new Inspir3DataNFTMinter(minterConfig);

        await this.minter.fetchDeployedContracts();

        return this.minter;
    }
}
