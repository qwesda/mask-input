<template>
  <div class="var-dump">
    <pre class="var-dump-content">{{ formattedOutput }}</pre>
  </div>
</template>

<script setup lang="ts">
  import { computed, type PropType } from 'vue';

  const props = defineProps({
    data: {
      type: null as unknown as PropType<any>,
      required: true,
    },
    maxDepth: {
      type: Number,
      default: 10,
    },
  });

  const isFlat = (arr: any[]): boolean => {
    return arr.every(
      (item) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean' || item === null || item === undefined,
    );
  };

  const formatValue = (value: any, depth: number = 0, visited: Set<any> = new Set()): string => {
    // Prevent infinite recursion
    if (depth > props.maxDepth) {
      return '*MAX_DEPTH*';
    }

    // Handle circular references
    if (value !== null && typeof value === 'object' && visited.has(value)) {
      return '*CIRCULAR*';
    }

    // Handle primitives
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'bigint') return `${value}n`;

    // Handle Date objects
    if (value instanceof Date) {
      return `Date(${value.toISOString()})`;
    }

    // Handle RegExp objects
    if (value instanceof RegExp) {
      return value.toString();
    }

    // Handle Map objects
    if (value instanceof Map) {
      if (value.size === 0) return 'Map(0) {}';

      visited.add(value);
      const indent = '  '.repeat(depth + 1);
      const entries = Array.from(value.entries())
        .map(([key, val]) => `${indent}${formatValue(key, depth, visited)} => ${formatValue(val, depth + 1, visited)}`)
        .join('\n');
      visited.delete(value);
      return `Map(${value.size}) {\n${entries}\n${'  '.repeat(depth)}}`;
    }

    // Handle Arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Array(0) []';

      // Check if array is flat (contains only primitives)
      if (isFlat(value)) {
        return `Array(${value.length}) [${value.map((item) => formatValue(item, depth, visited)).join(', ')}]`;
      }

      // Multi-line array for complex items
      visited.add(value);
      const indent = '  '.repeat(depth + 1);
      const items = value.map((item, index) => `${indent}${index}: ${formatValue(item, depth + 1, visited)}`).join('\n');
      visited.delete(value);
      return `Array(${value.length}) [\n${items}\n${'  '.repeat(depth)}]`;
    }

    // Handle Objects
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';

      visited.add(value);
      const indent = '  '.repeat(depth + 1);
      const entries = keys.map((key) => `${indent}${key}: ${formatValue(value[key], depth + 1, visited)}`).join('\n');
      visited.delete(value);
      return `{\n${entries}\n${'  '.repeat(depth)}}`;
    }

    return String(value);
  };

  const formattedOutput = computed(() => {
    try {
      return formatValue(props.data);
    } catch (error) {
      return `Error formatting data: ${error}`;
    }
  });
</script>

<style scoped>
  .var-dump {
    font-family: 'Courier New', Consolas, monospace;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 12px;
    margin: 8px 0;
    overflow-x: auto;
  }

  .var-dump-content {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.4;
    color: #333;
  }

  .var-dump:hover {
    border-color: #bbb;
  }
</style>
