import { constants, BitBox02API, getDevicePath } from 'bitbox02-api';

// see https://github.com/digitalbitbox/bitbox02-api-js#sample-integration
export default class BitBox02 {
  constructor(logout) {
    // You can provide the `logout` callback of your application in the constructor
    this.logout = logout;
    this.status = undefined;
    this.pairingConfirmed = false;
  }

  async init(keypath) {
    try {
      const devicePath = await getDevicePath();
      console.log(`BitBox02 device path = ${devicePath}`);
      this.api = new BitBox02API(devicePath);

      await this.api.connect(
        /** @param showPairingCb
         *  Store the pairing code on the class instance. Show this to the user to compare with code
         *  on the device when `this.status === 'unpaired'`
         */
        (pairingCode) => {
          this.pairingCode = pairingCode;
        },

        /** @param userVerify
         *  Store the Promise's `resolve` on the class instance to call when the user clicks the corresponding button
         *  in your application after confirming the pairing on device
         */
        async () => {
          return new Promise((resolve) => {
            this.pairingConfirmed = true;
            this.pairingConfirmationResolve = resolve;
          });
        },

        /** @param handleAttestationCb
         *  Store the attestation result on the class instance. If attestation fails, the user might have a fake device.
         *  Handle this condition below.
         */
        (attestationResult) => {
          this.attestation = attestationResult;
        },

        /** @param onCloseCb
         *  Log the user out of your application when device is unplugged/the websocket closes.
         *  Here we use the `logout` function provided in the constructor as the callback.
         */
        () => {
          this.logout();
        },

        /** @param setStatusCb
         *  Store the status on the class instance to take appropriate actions based on status.
         *  All possible status can be found here: https://github.com/digitalbitbox/bitbox02-api-go/blob/master/api/firmware/status.go
         */
        (status) => {
          this.status = status;
        }
      );
    } catch (e) {
      console.log(e);
      this.logout();
      return;
    }

    switch (this.api.firmware().Product()) {
      case constants.Product.BitBox02Multi:
        console.log('This is a BitBox02 Multi');
        break;
      case constants.Product.BitBox02BTCOnly:
        console.log('This is a BitBox02 BTC-only');
        break;
      default:
        console.log('This is not a BitBox02 device');
    }

    // Handle attestation failure
    if (!this.attestation) {
      console.log('Attestation failed');
    }
  }
}
