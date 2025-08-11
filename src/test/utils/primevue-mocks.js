/**
 * PrimeVue Component Mocks for Testing
 * Provides proper stubs for PrimeVue components that maintain expected behavior in tests
 */

export const createPrimeVueStubs = () => ({
  // Layout Components
  Card: {
    name: 'Card',
    template: `
      <div class="p-card">
        <div v-if="$slots.header" class="p-card-header"><slot name="header" /></div>
        <div class="p-card-body">
          <div v-if="$slots.title" class="p-card-title"><slot name="title" /></div>
          <div v-if="$slots.subtitle" class="p-card-subtitle"><slot name="subtitle" /></div>
          <div class="p-card-content"><slot name="content"><slot /></slot></div>
          <div v-if="$slots.footer" class="p-card-footer"><slot name="footer" /></div>
        </div>
      </div>
    `,
    props: ['header', 'style']
  },

  Dialog: {
    name: 'Dialog',
    template: `
      <div v-if="visible !== false" class="p-dialog-wrapper" :style="style">
        <div class="p-dialog">
          <div v-if="header || $slots.header" class="p-dialog-header">
            <slot name="header">{{ header }}</slot>
          </div>
          <div class="p-dialog-content">
            <slot />
          </div>
          <div v-if="$slots.footer" class="p-dialog-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    `,
    props: ['visible', 'modal', 'header', 'style', 'draggable', 'resizable'],
    emits: ['hide', 'update:visible']
  },

  // Form Components
  InputText: {
    name: 'InputText',
    template: `
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        :class="{ 'p-invalid': invalid }"
        :placeholder="placeholder"
        :id="id"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-describedby="ariaDescribedby"
        :aria-invalid="invalid ? 'true' : 'false'"
      />
    `,
    props: ['modelValue', 'invalid', 'placeholder', 'id', 'disabled', 'autocomplete', 'ariaDescribedby'],
    emits: ['update:modelValue', 'blur']
  },

  Textarea: {
    name: 'Textarea',
    template: `
      <textarea
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        :class="{ 'p-invalid': invalid }"
        :placeholder="placeholder"
        :id="id"
        :disabled="disabled"
        :rows="rows"
      ></textarea>
    `,
    props: ['modelValue', 'invalid', 'placeholder', 'id', 'disabled', 'rows'],
    emits: ['update:modelValue', 'blur']
  },

  Password: {
    name: 'Password',
    template: `
      <input
        type="password"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        :class="{ 'p-invalid': invalid }"
        :placeholder="placeholder"
        :id="id"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-describedby="ariaDescribedby"
        :aria-invalid="invalid ? 'true' : 'false'"
      />
    `,
    props: ['modelValue', 'invalid', 'placeholder', 'id', 'disabled', 'autocomplete', 'ariaDescribedby'],
    emits: ['update:modelValue', 'blur']
  },

  Checkbox: {
    name: 'Checkbox',
    template: `
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
        :id="id"
        :disabled="disabled"
        :class="{ 'p-invalid': invalid }"
      />
    `,
    props: ['modelValue', 'id', 'disabled', 'invalid'],
    emits: ['update:modelValue']
  },

  Calendar: {
    name: 'Calendar',
    template: `
      <input
        type="date"
        :value="modelValue ? new Date(modelValue).toISOString().split('T')[0] : ''"
        @input="$emit('update:modelValue', $event.target.value ? new Date($event.target.value) : null)"
        :class="{ 'p-invalid': invalid }"
        :id="id"
        :disabled="disabled"
      />
    `,
    props: ['modelValue', 'invalid', 'id', 'disabled'],
    emits: ['update:modelValue']
  },

  Dropdown: {
    name: 'Dropdown',
    template: `
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        :class="{ 'p-invalid': invalid }"
        :id="id"
        :disabled="disabled"
      >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value || option"
          :value="option.value || option"
        >
          {{ option.label || option }}
        </option>
      </select>
    `,
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'invalid', 'placeholder', 'id', 'disabled'],
    emits: ['update:modelValue']
  },

  InputNumber: {
    name: 'InputNumber',
    template: `
      <input
        type="number"
        :value="modelValue"
        @input="$emit('update:modelValue', parseFloat($event.target.value) || 0)"
        :min="min"
        :max="max"
        :step="step"
        :class="{ 'p-invalid': invalid }"
        :id="id"
        :disabled="disabled"
      />
    `,
    props: ['modelValue', 'min', 'max', 'step', 'invalid', 'id', 'disabled'],
    emits: ['update:modelValue']
  },

  MultiSelect: {
    name: 'MultiSelect',
    template: `
      <select
        multiple
        :value="modelValue || []"
        @change="handleChange"
        :class="{ 'p-invalid': invalid }"
        :id="id"
        :disabled="disabled || loading"
      >
        <option
          v-for="option in options"
          :key="option[optionValue] || option"
          :value="option[optionValue] || option"
          :selected="isSelected(option)"
        >
          {{ option[optionLabel] || option }}
        </option>
      </select>
    `,
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'invalid', 'placeholder', 'id', 'disabled', 'loading'],
    emits: ['update:modelValue'],
    methods: {
      handleChange(event) {
        const values = Array.from(event.target.selectedOptions).map(option => option.value)
        this.$emit('update:modelValue', values)
      },
      isSelected(option) {
        const value = option[this.optionValue] || option
        return (this.modelValue || []).includes(value)
      }
    }
  },

  // Button Components
  Button: {
    name: 'Button',
    template: `
      <button
        :type="type"
        :disabled="disabled || loading"
        :class="[
          'p-button',
          { 'p-button-loading': loading },
          severity ? \`p-button-\${severity}\` : ''
        ]"
        @click="$emit('click', $event)"
      >
        <i v-if="loading" class="p-button-loading-icon pi pi-spinner pi-spin"></i>
        <i v-else-if="icon" :class="[\`pi pi-\${icon}\`, iconPos === 'right' ? 'p-button-icon-right' : 'p-button-icon-left']"></i>
        <span class="p-button-label"><slot>{{ label }}</slot></span>
      </button>
    `,
    props: ['type', 'disabled', 'loading', 'severity', 'label', 'icon', 'iconPos'],
    emits: ['click']
  },

  // Message Components
  Message: {
    name: 'Message',
    template: `
      <div :class="[\`p-message p-message-\${severity}\`]">
        <div class="p-message-wrapper">
          <span :class="[\`p-message-icon pi pi-\${getIcon(severity)}\`]"></span>
          <div class="p-message-text">
            <slot />
          </div>
          <button v-if="closable" class="p-message-close p-link" @click="$emit('close')">
            <span class="p-message-close-icon pi pi-times"></span>
          </button>
        </div>
      </div>
    `,
    props: ['severity', 'closable'],
    emits: ['close'],
    methods: {
      getIcon(severity) {
        const icons = {
          success: 'check',
          info: 'info-circle',
          warn: 'exclamation-triangle',
          error: 'times-circle'
        }
        return icons[severity] || 'info-circle'
      }
    }
  },

  // Progress Components
  ProgressBar: {
    name: 'ProgressBar',
    template: `
      <div class="p-progressbar">
        <div class="p-progressbar-value" :style="{ width: value + '%' }"></div>
        <div v-if="showValue" class="p-progressbar-label">{{ value }}%</div>
      </div>
    `,
    props: ['value', 'showValue']
  },

  // Navigation Components
  Breadcrumb: {
    name: 'Breadcrumb',
    template: `
      <nav class="p-breadcrumb">
        <ul>
          <li v-for="(item, index) in model" :key="index" class="p-breadcrumb-item">
            <router-link v-if="item.route" :to="item.route" class="p-breadcrumb-link">
              {{ item.label }}
            </router-link>
            <span v-else class="p-breadcrumb-link">{{ item.label }}</span>
          </li>
        </ul>
      </nav>
    `,
    props: ['model']
  }
})

export const createPrimeVueConfig = () => ({
  global: {
    provide: {
      $primevue: {
        config: {
          theme: 'aura-light-green',
          options: {},
          pt: {},
          ptOptions: {}
        },
        changeTheme: () => {},
        isStylesLoaded: true,
        styled: true,
        unstyled: false
      }
    }
  }
})