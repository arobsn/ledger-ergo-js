<template>
  <ledger-interactions />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import LedgerInteractions from "./components/LedgerInteractions.vue";

export default defineComponent({
  name: "App",
  components: {
    LedgerInteractions
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
