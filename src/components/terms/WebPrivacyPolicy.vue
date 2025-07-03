<script setup lang="ts">
import { ref } from 'vue'

interface PolicySection {
  id: string
  title: string
  content?: string[]
  list?: string[]
}

const companyName = ref('EZBLOCK INC')
const lastUpdated = ref('Feb 07, 2025')
const contactEmail = ref('contact@cylonix.io')

const policySections = ref<PolicySection[]>([
  {
    id: 'introduction',
    title: `${companyName.value} Web Site Privacy Policy`,
    content: [
      `If you have any questions, comments or suggestions, please send your questions to: ${contactEmail.value}, we will deal with it within 7 working days.`,
      'This policy will help you understand the following:',
    ],
    list: [
      'how we collect and use your personal information;',
      'how we use cookies and similar technologies;',
      'how we share, transfer, and publicly disclose your personal information;',
      'how we protect your personal information;',
      'your rights;',
      'how this policy is updated;',
      'how to contact us;',
    ],
  },
  {
    id: 'commitment',
    title: '',
    content: [
      'Company is well aware of the importance of personal information to you, and will do its best to protect the safety and reliability of your personal information. We are committed to maintaining your trust in us and abide by the following principles to protect your personal information: the principle of consistency of rights and responsibilities, the principle of clear purpose, the principle of choosing consent, the principle of least sufficiency, the principle of ensuring security, the principle of subject participation, the principle of openness and transparency, etc. At the same time, Company promises that we will take corresponding security protection measures to protect your personal information in accordance with the mature security standards in the industry.',
      'In order for you to understand the types and purposes of information we need to collect when you use our services, we will explain to you one by one in combination with specific services. Please read and understand this "Privacy Policy" carefully before using our products (or services).',
    ],
  },
  {
    id: 'collection',
    title: 'How we collect and use your personal information',
    content: [
      'Personal information refers to all kinds of information recorded electronically or in other ways that can identify the identity of a specific natural person or reflect the activities of a specific natural person alone or in combination with other information.',
      'Sensitive personal information refers to personal information that, once leaked, illegally provided or abused, may endanger personal and property safety, easily lead to damage to personal reputation, physical and mental health, or discriminatory treatment.',
      "Company will only collect and use users' personal information for your account password protection, login and registration services.",
    ],
  },
  {
    id: 'cookies',
    title: 'How we use cookies and similar technologies',
    content: [
      'We use cookies only to save your login information and status on the client side, or to save your current simple configuration information of this website, and will not be used for other purposes.',
    ],
  },
  {
    id: 'sharing',
    title:
      'How do we share, transfer and publicly disclose your personal information',
    content: [
      'We may share your personal information externally in accordance with laws and regulations or the mandatory requirements of government authorities. Or under some irresistible conditions (including but not limited to: bankruptcy, acquisition, merger, etc.), the internal transfer will be carried out under the condition of ensuring the safety of personal information.',
    ],
  },
  {
    id: 'protection',
    title: 'How we protect your personal information',
    content: [
      'We have used industry-standard security safeguards to protect the personal information you provide against unauthorized access, public disclosure, use, modification, damage or loss. We will take all reasonably practicable steps to protect the personal information of users of your site. The data exchange between the browsers of your site users and the "service" (such as collecting user visit frequency, visit preferences and website performance) is protected by encryption; we also provide https secure browsing methods for our own products and websites; we will use Encryption technology ensures data confidentiality; we use trusted protection mechanisms to prevent data from being maliciously attacked; we deploy access control mechanisms to ensure that only authorized personnel can access personal information; and we conduct security and privacy protection training courses, to enhance employees\' awareness of the importance of protecting personal information.',
    ],
  },
  {
    id: 'rights',
    title: 'Your rights',
    content: [
      'You can access and modify your personal information through email, the personal information page in the Cylonix app, etc. Of course, you can also contact us by email to delete your personal information. After deletion, we will no longer provide any services.',
    ],
  },
  {
    id: 'updates',
    title: 'How to update this policy',
    content: [
      'Our Privacy Policy is subject to change.',
      'We will not reduce your rights under this Privacy Policy without your express consent. We will post any changes to this policy on this page.',
      'For material changes, we will also provide more prominent notices (including, for some services, we will send a notice by email explaining the specific changes to the Privacy Policy).',
      'Material changes referred to in this policy include, but are not limited to:',
    ],
    list: [
      'There has been a major change in our service model. Such as the purpose of processing personal information, the type of personal information processed, the way of using personal information, etc.;',
      'We have significant changes in ownership structure, organizational structure, etc. Such as changes in owners caused by business adjustments, bankruptcy mergers and acquisitions, etc.;',
      'Changes to the main objects of personal information sharing, transfer or public disclosure;',
      'material changes in your rights to participate in the processing of personal information and the way they are exercised;',
      'When our responsible department responsible for handling personal information security, contact information and complaint channels change;',
      'When the personal information security impact assessment report indicates that there is a high risk. We will also archive older versions of this policy for your review.',
    ],
  },
  {
    id: 'contact',
    title: 'How to contact us',
    content: [
      `Contact us by email: ${contactEmail.value}. After receiving the email, we will process it within 7 working days.`,
      'If you are not satisfied with our response, especially if our personal information processing behavior has harmed your legitimate rights and interests, you can also seek solutions through legal channels or by going to industry self-regulatory associations and other institutions.',
      `Company name: ${companyName.value}`,
    ],
  },
])
</script>

<template>
  <div class="mx-auto w-75 py-5">
    <div class="container mt-5">
      <div class="version-info">
        <h5>Last updated: {{ lastUpdated }}</h5>
        <h5>Version effective date: {{ lastUpdated }}</h5>
      </div>

      <section v-for="section in policySections" :key="section.id">
        <h4 v-if="section.title">{{ section.title }}</h4>
        <template v-if="section.content">
          <p v-for="(paragraph, idx) in section.content" :key="idx">
            {{ paragraph }}
          </p>
        </template>

        <ul v-if="section.list">
          <li v-for="(item, index) in section.list" :key="index">
            {{ item }}
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
:root {
  --primary-color: #0066ff;
  --primary-dark: #0052cc;
  --text-color: #2d3748;
  --heading-color: #1a202c;
  --background-color: #f7fafc;
  --card-background: #ffffff;
  --border-color: #e2e8f0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.7;
  color: var(--text-color);
  background-color: var(--background-color);
  margin: 0;
  padding: 0;
}

.header-banner {
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--primary-dark) 100%
  );
  color: white;
  padding: 3rem 0;
  text-align: center;
  margin-bottom: 0;
}

.header-banner h2 {
  color: white;
  font-size: 2.25rem;
  margin: 0;
  padding: 0;
  border: none;
  font-weight: 700;
}

.container {
  max-width: 900px;
  margin: -3rem auto 3rem;
  padding: 2.5rem;
  background: var(--card-background);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  position: relative;
}

.version-info {
  background-color: rgba(0, 102, 255, 0.05);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 2rem;
}

h5 {
  color: var(--primary-color);
  font-size: 1rem;
  margin: 0.5rem 0;
  font-weight: 600;
}

h4 {
  color: var(--heading-color);
  font-size: 1.5rem;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  line-height: 1.4;
}

p {
  margin-bottom: 1.25rem;
  font-size: 1.05rem;
  line-height: 1.8;
}

ul {
  margin: 1.5rem 0;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 1rem;
  line-height: 1.6;
}

li p {
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .container {
    margin: 1rem;
    padding: 1.5rem;
    border-radius: 0;
  }

  .header-banner {
    padding: 2rem 0;
  }

  .header-banner h2 {
    font-size: 1.75rem;
  }

  h4 {
    font-size: 1.25rem;
  }

  p {
    font-size: 1rem;
  }
}

@media print {
  body {
    background: white;
  }

  .container {
    box-shadow: none;
    margin: 0;
    padding: 1rem;
  }

  .header-banner {
    background: none;
    color: var(--heading-color);
  }

  .header-banner h2 {
    color: var(--heading-color);
  }
}
</style>
