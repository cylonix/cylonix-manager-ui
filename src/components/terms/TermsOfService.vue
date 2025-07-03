<script setup lang="ts">
import { ref } from 'vue'

interface TermsSection {
  id: number
  title: string
  content: string
  list?: string[]
}

const lastUpdated = ref('April 22, 2025')
const contactEmail = ref('contact@cylonix.io')

const termsSections = ref<TermsSection[]>([
  {
    id: 1,
    title: 'Acceptance of Terms',
    content:
      'By accessing or using Cylonix application ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.',
  },
  {
    id: 2,
    title: 'Service Description',
    content:
      'Cylonix provides an application service. We reserve the right to modify, suspend, or discontinue the Service at any time without notice.',
  },
  {
    id: 3,
    title: 'User Responsibilities',
    content: 'You agree to:',
    list: [
      'Provide accurate and complete information when using the Service',
      'Maintain the security of your account credentials',
      'Use the Service in compliance with applicable laws and regulations',
      'Not engage in any activity that interferes with or disrupts the Service',
    ],
  },
  {
    id: 4,
    title: 'Service Availability',
    content: 'We reserve the right to:',
    list: [
      'Refuse service to anyone for any reason at any time',
      'Terminate accounts or access to the Service at our discretion',
      'Modify or discontinue any aspect of the Service without notice',
    ],
  },
  {
    id: 5,
    title: 'Limitation of Liability',
    content:
      'The Service is provided "as is" and "as available" without any warranties, either express or implied. Cylonix shall not be liable for:',
    list: [
      'Any direct, indirect, incidental, special, consequential, or exemplary damages',
      'Loss of profits, revenue, data, or business opportunities',
      'Service interruptions, errors, or delays',
      'Data loss or corruption',
      'Any damages resulting from unauthorized access to user accounts',
    ],
  },
  {
    id: 6,
    title: 'Indemnification',
    content:
      "You agree to indemnify and hold harmless Cylonix, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from your use of the Service.",
  },
  {
    id: 7,
    title: 'Changes to Terms',
    content:
      'We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on our website. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.',
  },
  {
    id: 8,
    title: 'Governing Law',
    content:
      'These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflicts of law principles.',
  },
])
</script>

<template>
  <div class="container mx-auto py-5 w-75">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <h1>Terms of Service</h1>
        <p class="last-updated">Last updated: {{ lastUpdated }}</p>

        <section v-for="section in termsSections" :key="section.id">
          <h2>{{ section.id }}. {{ section.title }}</h2>
          <p>{{ section.content }}</p>
          <ul v-if="section.list">
            <li v-for="(item, index) in section.list" :key="index">
              {{ item }}
            </li>
          </ul>
        </section>

        <section class="contact-section">
          <h2>Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <ul>
            <li>Email: {{ contactEmail }}</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.last-updated {
  color: #666;
  font-style: italic;
  margin-bottom: 2rem;
}

h1 {
  margin-bottom: 1rem;
}

h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
}

section {
  margin-bottom: 2rem;
}

ul {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

ul ul {
  padding-left: 2rem;
  margin-top: 0.5rem;
}

li {
  margin-bottom: 0.5rem;
}

li:last-child {
  margin-bottom: 0;
}

.contact-section {
  margin-top: 3rem;
}
</style>
