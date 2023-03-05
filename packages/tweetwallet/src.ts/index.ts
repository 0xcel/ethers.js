"use strict";

import { getAddress } from "@ethersproject/address";
import { Provider, TransactionRequest } from "@ethersproject/abstract-provider";
import { ExternallyOwnedAccount, Signer } from "@ethersproject/abstract-signer";
import { Bytes } from "@ethersproject/bytes";
import { _TypedDataEncoder } from "@ethersproject/hash";
import { keccak256 } from "@ethersproject/keccak256";
import { defineReadOnly, resolveProperties } from "@ethersproject/properties";
import { serialize, UnsignedTransaction } from "@ethersproject/transactions";

import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
const logger = new Logger(version);

export class TweetWallet extends Signer implements ExternallyOwnedAccount {

    readonly address: string;
    readonly handle: string;
    readonly provider: Provider;

    constructor(handle: string, provider?: Provider) {
        super();

        this.handle = handle;

        let address: string = getAddress(keccak256(handle).substring(26));
        this.address = address;

        /* istanbul ignore if */
        if (provider && !Provider.isProvider(provider)) {
            logger.throwArgumentError("invalid provider", "provider", provider);
        }

        defineReadOnly(this, "provider", provider || null);
    }

    get privateKey(): string { return ""; }

    getAddress(): Promise<string> {
        return Promise.resolve(this.address);
    }

    connect(provider: Provider): TweetWallet {
        return new TweetWallet(this.handle, provider);
    }

    signTransaction(transaction: TransactionRequest): Promise<string> {
        return resolveProperties(transaction).then((tx) => {
            if (tx.from != null) {
                if (getAddress(tx.from) !== this.address) {
                    logger.throwArgumentError("transaction from address mismatch", "transaction.from", transaction.from);
                }
                delete tx.from;
            }
            
            // Build the transaction
            let txbytes = serialize(<UnsignedTransaction>tx)

            // trigger tweet
            let tweet_url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(txbytes) + '&hashtags=' + encodeURIComponent("0xcel");
            (window as any).open(tweet_url, "_blank")

            return txbytes;
        });
    }

    async signMessage(message: Bytes | string): Promise<string> {
        return "unsupported";
    }
}

// export function verifyMessage(message: Bytes | string, signature: SignatureLike): string {
//     return recoverAddress(hashMessage(message), signature);
// }
