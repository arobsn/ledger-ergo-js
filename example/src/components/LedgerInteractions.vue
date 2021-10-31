<template>
  <p>
    <label>Use authToken<input type="checkbox" v-model="useAuthToken"/></label>
    <code>{{ hexAuthToken }}</code>
    <button @click="newToken()">newToken</button>
  </p>
  <p>
    <button @click="getVersion()">GetVersion</button>
    <button @click="getAppName()">GetAppName</button>
    <button @click="getExtendedPublicKey()">GetExtendedPublicKey</button>
    <button @click="deriveAddress()">deriveAddress</button>
    <button @click="showAddress()">showAddress</button>
  </p>
  <p>
    <code>{{ data }}</code>
  </p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ErgoApp from "../../../src/erg";
import HidTransport from "@ledgerhq/hw-transport-webhid";
import { serializeAuthToken } from "../../../src/interactions/common/serialization";

export default defineComponent({
  name: "LedgerInteractions",
  data: () => {
    return {
      data: "",
      useAuthToken: true,
      authToken: 0
    };
  },
  created() {
    this.newToken();
  },
  computed: {
    hexAuthToken() {
      return `0x${serializeAuthToken(this.authToken).toString("hex")}`;
    }
  },
  methods: {
    async getVersion() {
      var ergoApp = await this.createApp();
      try {
        this.data = JSON.stringify(await ergoApp.getAppVersion());
      } catch (e) {
        this.data = (e as Error).message;
      } finally {
        ergoApp.closeTransport();
      }
    },
    async getAppName() {
      var ergoApp = await this.createApp();
      try {
        this.data = JSON.stringify(await ergoApp.getAppName());
      } catch (e) {
        this.data = (e as Error).message;
      } finally {
        ergoApp.closeTransport();
      }
    },
    async getExtendedPublicKey() {
      var ergoApp = await this.createApp();
      this.data = "Awaiting approval on the device...";
      try {
        this.data = JSON.stringify(
          await ergoApp.getExtendedPublicKey("m/44'/429'/0'", this.useAuthToken)
        );
      } catch (e) {
        this.data = (e as Error).message;
      } finally {
        ergoApp.closeTransport();
      }
    },
    async deriveAddress() {
      var ergoApp = await this.createApp();
      this.data = "Awaiting approval on the device...";
      try {
        this.data = JSON.stringify(
          await ergoApp.deriveAddress("m/44'/429'/0'/1/0", this.useAuthToken)
        );
      } catch (e) {
        this.data = (e as Error).message;
      } finally {
        ergoApp.closeTransport();
      }
    },
    newToken() {
      this.authToken = Math.floor(Math.random() * 0xffffffff) + 1;
    },
    async showAddress() {
      var ergoApp = await this.createApp();
      this.data = "Check the address at device display...";
      try {
        this.data = JSON.stringify(
          await ergoApp.showAddress("m/44'/429'/0'/1/0", this.useAuthToken)
        );
      } catch (e) {
        this.data = (e as Error).message;
      } finally {
        ergoApp.closeTransport();
      }
    },
    async createApp(): Promise<ErgoApp> {
      return new ErgoApp(await HidTransport.create(), this.useAuthToken ? this.authToken : 0);
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
