<script setup lang="ts">
import { ref } from 'vue'

interface ListItem {
  title: string
  items: string[]
}

interface PolicySection {
  title: string
  description?: string
  listDescription?: string
  nestedList?: boolean
  list?: Array<string | ListItem>
}

const lastUpdated = ref('April 22, 2025')
const contactEmail = ref('contact@cylonix.io')

const policySections = ref<PolicySection[]>([
  {
    title: 'Introduction',
    description:
      'This Privacy Policy describes how Cylonix ("we", "us", or "our") collects, uses, and protects your personal information when you use our application. We are committed to ensuring the privacy and security of your personal information while providing you with the best possible user experience.',
  },
  {
    title: 'Information We Collect',
    listDescription: 'We collect the following types of information:',
    nestedList: true,
    list: [
      {
        title: 'Device Information',
        items: ['IP addresses', 'Device model information'],
      },
      {
        title: 'Account Information',
        items: ['Email address used for sign-in'],
      },
      {
        title: 'Diagnostic Information',
        items: [
          'Application logs for troubleshooting and support purposes',
          'Error reports and performance data',
        ],
      },
    ],
  },
  {
    title: 'How We Use Your Information',
    listDescription:
      'We use the collected information for the following purposes:',
    list: [
      'To provide and maintain our service',
      'To authenticate users and manage account access',
      'To provide technical support and troubleshoot issues',
      "To improve our application's performance and user experience",
      'To communicate with you about service-related matters',
    ],
  },
  {
    title: 'Diagnostic Logs',
    listDescription: 'Diagnostic logs are collected to help us:',
    list: [
      'Analyze and fix application issues',
      'Provide effective technical support',
      'Improve application stability and performance',
    ],
    description:
      'You can disable diagnostic log collection through the application settings at any time. Please note that disabling logs may limit our ability to provide technical support if issues arise.',
  },
  {
    title: 'Data Protection',
    description:
      'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
  },
  {
    title: 'Data Retention',
    description:
      'We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy. Diagnostic logs are automatically deleted after 30 days unless needed for ongoing support cases.',
  },
  {
    title: 'Your Rights',
    listDescription: 'You have the right to:',
    list: [
      'Access your personal information',
      'Correct inaccurate personal information',
      'Request deletion of your personal information',
      'Opt-out of diagnostic log collection',
      'Request a copy of your personal information',
    ],
  },
  {
    title: 'Updates to This Policy',
    description:
      'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.',
  },
])
</script>
<template>
  <div class="container mx-auto py-5 w-75">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <h1>Privacy Policy</h1>
        <p class="last-updated">Last updated: {{ lastUpdated }}</p>

        <section v-for="(section, index) in policySections" :key="index">
          <h2>{{ section.title }}</h2>
          <p v-if="section.description">{{ section.description }}</p>

          <template v-if="section.list">
            <p v-if="section.listDescription">{{ section.listDescription }}</p>
            <ul>
              <template v-if="section.nestedList">
                <li v-for="(item, idx) in section.list" :key="idx">
                  <strong v-if="typeof item === 'object'"
                    >{{ item.title }}:</strong
                  >
                  <ul>
                    <li
                      v-for="(subItem, subIdx) in item.items"
                      :key="subIdx"
                      v-if="typeof item === 'object' && item.items"
                    >
                      {{ subItem }}
                    </li>
                  </ul>
                </li>
              </template>
              <template v-else>
                <li v-for="(item, idx) in section.list" :key="idx">
                  {{ item }}
                </li>
              </template>
            </ul>
          </template>
        </section>

        <section class="contact-section">
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at:
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
