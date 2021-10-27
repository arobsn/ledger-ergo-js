<template>
  <button @click="getVersion()">GetVersion</button>
  <button @click="getAppName()">GetAppName</button>
  <button @click="getExtendedPublicKey()">GetExtendedPublicKey</button>
  <button @click="deriveAddress()">deriveAddress</button>
  <button @click="showAddress()">showAddress</button>
  <p>
    <code>{{ data }}</code>
  </p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ErgoApp from "../../../src/erg";
import HidTransport from "@ledgerhq/hw-transport-webhid";

export default defineComponent({
  name: "LedgerInteractions",
  data: () => {
    return { data: "" };
  },
  methods: {
    async getVersion() {
      let ergoApp = new ErgoApp(await HidTransport.create());
      try {
        this.data = JSON.stringify(await ergoApp.getAppVersion());
      } catch (e) {
        this.data = (e as Error).message;
      } finally {
        ergoApp.closeTransport();
      }
    },
    async getAppName() {
      let ergoApp = new ErgoApp(await HidTransport.create());
      try {
        this.data = JSON.stringify(await ergoApp.getAppName());
      } catch (e) {
        this.data = (e as Error).message;
      } finally {
        ergoApp.closeTransport();
      }
    },
    async getExtendedPublicKey() {
      let ergoApp = new ErgoApp(await HidTransport.create());
      this.data = "Awaiting approval on the device...";
      try {
        this.data = JSON.stringify(await ergoApp.getExtendedPublicKey("m/44'/429'/0'"));
      } catch (e) {
        this.data = (e as Error).message;
      } finally {
        ergoApp.closeTransport();
      }
    },
    async deriveAddress() {
      let ergoApp = new ErgoApp(await HidTransport.create());
      this.data = "Awaiting approval on the device...";
      try {
        this.data = JSON.stringify(await ergoApp.deriveAddress("m/44'/429'/0'/1/0"));
      } catch (e) {
        this.data = (e as Error).message;
      } finally {
        ergoApp.closeTransport();
      }
    },
    async showAddress() {
      let ergoApp = new ErgoApp(await HidTransport.create());
      this.data = "Check the address at device display...";
      try {
        this.data = JSON.stringify(await ergoApp.showAddress("m/44'/429'/0'/1/0"));
      } catch (e) {
        this.data = (e as Error).message;
      } finally {
        ergoApp.closeTransport();
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
