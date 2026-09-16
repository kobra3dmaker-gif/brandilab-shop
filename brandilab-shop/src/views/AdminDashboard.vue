<script setup lang="ts">
import { ref, onMounted } from 'vue';

const orders = ref<any[]>([]);
const isLoading = ref(true);

const API_URL = 'https://script.google.com/macros/s/AKfycbyoabX_NApRnMiAIG6tXyY9mh-X2ckH5egpfdI4WrM9J6J6TwHE9dkVRw3OHIYPvRnuRw/exec';
const API_TOKEN = 'BrandiLab_Admin_99xK2pL5_2026!';

onMounted(async () => {
  try {
    const response = await fetch(`${API_URL}?token=${API_TOKEN}`);
    const data = await response.json();
    orders.value = data.reverse(); 
  } catch (error) {
    console.error("Failed to fetch orders:", error);
  } finally {
    isLoading.value = false;
  }
});

const markAsShipped = async (order: any) => {
  order.isUpdating = true; 

  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        token: API_TOKEN,
        action: 'markShipped',
        date: order['Data'],
        username: order['Username Vinted']
      })
    });
    
    order['Stato'] = 'Spedito';
    
  } catch (error) {
    console.error('Error updating order:', error);
    alert('Failed to update the order.');
  } finally {
    order.isUpdating = false;
  }
};
</script>

<template>
  <div class="admin-container">
    <h1>Order Management</h1>
    <p v-if="isLoading">Loading orders...</p>
    
    <table v-else>
      <thead>
        <tr>
          <th>Date</th>
          <th>Platform</th>
          <th>Product</th>
          <th>Buyer</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(order, index) in orders" :key="index" :class="{ 'shipped-row': order['Stato'] === 'Spedito' }">
          <td>{{ order['Data'] }}</td>
          <td>{{ order['Piattaforma'] }}</td>
          <td>{{ order['Prodotto'] }}</td>
          <td>{{ order['Username Vinted'] }}</td>
          
          <td>
            <span class="status-badge">{{ order['Stato'] || 'Da spedire' }}</span>
          </td>
          
          <td>
            <button 
              @click="markAsShipped(order)" 
              :disabled="order['Stato'] === 'Spedito' || order.isUpdating"
            >
              <span v-if="order.isUpdating">Processing...</span>
              <span v-else-if="order['Stato'] === 'Spedito'">Completed</span>
              <span v-else>Mark as Shipped ✓</span>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.shipped-row {
  opacity: 0.6;
  background-color: #f8fff9;
}
.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #eee;
  font-weight: bold;
}
.shipped-row .status-badge {
  background-color: #d9ead3;
  color: #274e13;
}
</style>
