<template>
  <button @click="getVersion()">GetVersion</button>
  <button @click="getAppName()">GetAppName</button>
  <button @click="getExtendedPublicKey()">GetExtendedPublicKey</button>
  <button @click="deriveAddress()">deriveAddress</button>
  <button @click="showAddress()">showAddress</button>
  <button @click="resetTransport()">resetTransport</button>
  <p>
    <code>{{ data }}</code>
  </p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ErgoApp from "../../../src/erg";
import HidTransport from "@ledgerhq/hw-transport-webhid";

var ergoApp: ErgoApp;

export default defineComponent({
  name: "LedgerInteractions",
  data: () => {
    return { data: "" };
  },
  beforeDestroy() {
    if (ergoApp) {
      ergoApp.closeTransport();
    }
  },
  methods: {
    async getVersion() {
      await this.createApp();
      try {
        this.data = JSON.stringify(await ergoApp.getAppVersion());
      } catch (e) {
        this.data = (e as Error).message;
      }
    },
    async getAppName() {
      await this.createApp();
      try {
        this.data = JSON.stringify(await ergoApp.getAppName());
      } catch (e) {
        this.data = (e as Error).message;
      }
    },
    async getExtendedPublicKey() {
      await this.createApp();
      this.data = "Awaiting approval on the device...";
      try {
        this.data = JSON.stringify(await ergoApp.getExtendedPublicKey("m/44'/429'/0'", true));
      } catch (e) {
        this.data = (e as Error).message;
      }
    },
    async deriveAddress() {
      await this.createApp();
      this.data = "Awaiting approval on the device...";
      try {
        this.data = JSON.stringify(await ergoApp.deriveAddress("m/44'/429'/0'/1/0", true));
      } catch (e) {
        this.data = (e as Error).message;
      }
    },
    async showAddress() {
      await this.createApp();
      this.data = "Check the address at device display...";
      try {
        this.data = JSON.stringify(await ergoApp.showAddress("m/44'/429'/0'/1/0", true));
      } catch (e) {
        this.data = (e as Error).message;
      }
    },
    async resetTransport() {
      await ergoApp.closeTransport();
      await this.createApp(true);
    },
    async createApp(force = false) {
      if (!ergoApp || force) {
        ergoApp = new ErgoApp(await HidTransport.create());
      }
    }
  }
});
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
code {
  font-size: 1.2em;
  word-break: break-all;
  font-family: monospace;
}
button {
  margin: 0.5em;
  padding: 0.2em;
}
</style>
