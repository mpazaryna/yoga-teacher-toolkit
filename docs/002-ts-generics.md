# TypeScript Generics Guide

TypeScript generics are a powerful feature that enables you to write flexible, reusable code while maintaining type safety. This guide explains generics using practical examples from our template generator implementation.

## Basic Concepts

### What are Generics?

Generics act as type variables - they let you capture types that you can use throughout interfaces, functions, or classes. Think of them as "type parameters" that allow you to work with multiple types while preserving type information.

### Basic Syntax

```typescript
// Generic interface
interface Container<T> {
  value: T;
}

// Generic function
function identity<T>(arg: T): T {
  return arg;
}
```

## Real-World Example: Template Generator

Let's explore generics through our template generator implementation:

### 1. Generic Configuration Type

```typescript
export type ContentConfig<T extends Record<string, unknown>> = {
  provider: ProviderType;
  template: TemplateConfig;
  context: T;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}
```

This type allows us to create configurations for different content types while ensuring type safety for the context.

### 2. Generic Function Implementation

```typescript
export const generate = async <T extends Record<string, unknown>>(
  config: ContentConfig<T>
): Promise<string> => {
  // Implementation
}
```

### 3. Usage Examples

```typescript
// Yoga sequence context
interface YogaContext {
  level: string;
  duration: string;
  focus: string;
  props?: string[];
}

// Dharma talk context
interface DharmaTalkContext {
  concept: string;
  scriptureReference?: string;
  targetAudience?: string;
}

// Using with different types
const yogaConfig: ContentConfig<YogaContext> = {
  provider: "gemini",
  template: "sequence-template.md",
  context: {
    level: "intermediate",
    duration: "60 minutes",
    focus: "hip opening"
  }
};

const dharmaConfig: ContentConfig<DharmaTalkContext> = {
  provider: "gemini",
  template: "dharma-template.md",
  context: {
    concept: "mindfulness",
    targetAudience: "beginners"
  }
};
```

## Why Generics Power Our Template Generator

Our template generation system uses generics to solve several key challenges:

1. **Type-Safe Content Generation**

   ```typescript
   // The generator enforces correct context for each content type
   const yogaSequence = await generate<YogaContext>({
     context: {
       level: "intermediate",    // Required for yoga
       duration: "60 minutes",   // Required for yoga
       focus: "hip opening"      // Required for yoga
     },
     // ... other config
   });

   const dharmaTalk = await generate<DharmaTalkContext>({
     context: {
       concept: "mindfulness",   // Required for dharma
       scriptureReference: "Heart Sutra"  // Optional for dharma
     },
     // ... other config
   });
   ```

   TypeScript will catch errors if you try to use yoga properties in a dharma talk or vice versa.

2. **Single Function, Multiple Content Types**

   ```typescript
   // One generate function handles all content types
   export const generate = async <T extends Record<string, unknown>>(
     config: ContentConfig<T>
   ): Promise<string>
   ```

   Without generics, we'd need separate functions like `generateYogaSequence`, `generateDharmaTalk`, etc.

3. **Extensible Design**

   ```typescript
   // Adding a new content type is as simple as defining its context
   interface MeditationContext {
     duration: string;
     technique: string;
     level: string;
   }

   // The generate function automatically works with the new type
   const meditation = await generate<MeditationContext>({
     context: {
       duration: "20 minutes",
       technique: "vipassana",
       level: "beginner"
     },
     // ... other config
   });
   ```

4. **Template Context Type Safety**

   ```typescript
   // The template injection is type-safe
   const injectContext = <T extends Record<string, unknown>>(
     template: string,
     context: T
   ): string => {
     // TypeScript knows exactly what properties are available in context
     return template.replace(/\{\{(\w+)\}\}/g, (_, key) => 
       String(context[key as keyof T] ?? '')
     );
   };
   ```

5. **Compile-Time Validation**

   ```typescript
   // TypeScript catches missing required fields
   const invalidYoga = await generate<YogaContext>({
     context: {
       level: "intermediate"
       // Error: missing required 'duration' and 'focus'
     }
   });

   // And catches incorrect field types
   const invalidDharma = await generate<DharmaTalkContext>({
     context: {
       concept: 123,  // Error: number is not assignable to string
       targetAudience: "beginners"
     }
   });
   ```

This generic design gives us:

- Type safety across the entire generation pipeline
- Code reuse without sacrificing type information
- Easy extensibility for new content types
- Compile-time validation of content structures
- Clear interfaces for different content types

## Understanding Record Types and Generic Constraints

### The Record Type and Index Signatures

TypeScript's `Record<K, V>` type is a utility type that creates an object type with keys of type `K` and values of type `V`. In our template generator, we use `Record<string, unknown>` which means "an object that can have any string key with any type of value."

```typescript
// Basic Record type examples
type StringRecord = Record<string, string>;  // All values must be strings
const validStringRecord: StringRecord = {
  name: "value",      // OK
  count: "42"        // OK
  // count: 42       // Error: must be string
};

// Our usage: Record<string, unknown>
type FlexibleRecord = Record<string, unknown>;  // Values can be anything
const validFlexibleRecord: FlexibleRecord = {
  name: "value",     // OK
  count: 42,         // OK
  active: true,      // OK
  data: { x: 1 }     // OK
};
```

### Why We Need Record in Our Template Generator

In our template generator, we use `Record<string, unknown>` as a constraint for our context types for two key reasons:

1. **Dynamic Property Access**: Our template system needs to access properties dynamically:
   ```typescript
   // Inside our template injection system
   const injectContext = <T extends Record<string, unknown>>(
     template: string,
     context: T
   ): string => {
     return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
       // We need to access context[key] dynamically
       // Without Record, TypeScript would not allow this
       return String(context[key] ?? '');
     });
   };
   ```

2. **Type Safety with Flexibility**: We want to allow any object with string keys while maintaining type safety:
   ```typescript
   // Before extending Record
   interface YogaContext {
     level: string;
     duration: string;
     // ... other properties
   }
   
   // This would fail:
   const context: YogaContext = { level: "intermediate" };
   const value = context["someRandomKey"];  // Error: Property not found
   
   // After extending Record
   interface YogaContext extends Record<string, unknown> {
     level: string;
     duration: string;
     // ... other properties
   }
   
   // Now this works:
   const context: YogaContext = { level: "intermediate" };
   const value = context["someRandomKey"];  // OK: returns undefined
   ```

### How Record Extension Works

When we extend `Record<string, unknown>`, we're telling TypeScript:

1. **Base Capability**: The type can be indexed with any string key
2. **Specific Requirements**: It must have certain required properties with specific types
3. **Additional Properties**: It can have additional properties of any type

```typescript
// Let's break down what happens:
interface DharmaTalkContext extends Record<string, unknown> {
  concept: string;    // Must have this as string
  duration?: string;  // May have this as string
}

const talk: DharmaTalkContext = {
  concept: "mindfulness",     // Required property ✅
  duration: "30 minutes",     // Optional property ✅
  extraNote: "remember to",   // Additional string property ✅
  flag: true,                 // Additional boolean property ✅
  count: 42                   // Additional number property ✅
};

// All these are valid:
console.log(talk.concept);          // Type is string
console.log(talk.duration);         // Type is string | undefined
console.log(talk["extraNote"]);     // Type is unknown
console.log(talk["anyKey"]);        // Type is unknown
```

### Alternative Approaches

There are other ways we could have solved this, each with trade-offs:

1. **Index Signature**:
   ```typescript
   interface YogaContext {
     [key: string]: unknown;  // Index signature
     level: string;
     duration: string;
   }
   ```

2. **Intersection Types**:
   ```typescript
   type YogaContext = {
     level: string;
     duration: string;
   } & Record<string, unknown>;
   ```

3. **Generic Constraint Relaxation**:
   ```typescript
   // Could have made our generic less strict
   type ContentConfig<T extends object> = {
     context: T;
     // ... other properties
   }
   ```

We chose extending `Record<string, unknown>` because it:
- Provides the clearest intent
- Maintains strict type checking for required properties
- Allows dynamic property access
- Keeps template processing type-safe
- Makes the relationship between the interface and its indexable nature explicit

### Best Practices for Record Types

1. **Use `unknown` over `any`**:
   ```typescript
   // Better - more type-safe
   type SafeRecord = Record<string, unknown>;
   
   // Avoid - less type-safe
   type UnsafeRecord = Record<string, any>;
   ```

2. **Be Explicit About Required Properties**:
   ```typescript
   // Good - clear what's required
   interface ConfigContext extends Record<string, unknown> {
     required: string;
     optional?: number;
   }
   
   // Avoid - unclear requirements
   type UnclearContext = Record<string, unknown> & {
     required: string;
   };
   ```

3. **Document Dynamic Properties**:
   ```typescript
   /** 
    * Represents a yoga sequence context.
    * Required properties are explicitly typed.
    * Additional properties may be added at runtime.
    */
   interface YogaContext extends Record<string, unknown> {
     // ... properties
   }
   ```

## Generic Constraints

### Basic Constraints

Constraints limit what types can be used with a generic. Use the `extends` keyword to define constraints:

```typescript
// T must be an object with string keys
function processObject<T extends Record<string, unknown>>(obj: T): void {
  // Implementation
}

// T must have a length property
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}
```

### Multiple Type Parameters

You can use multiple type parameters:

```typescript
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}
```

## Best Practices

1. **Meaningful Names**: Use descriptive names for type parameters:

   ```typescript
   // Good
   interface Repository<EntityType> {
     findById(id: string): Promise<EntityType>;
   }
   
   // Less clear
   interface Repository<T> {
     findById(id: string): Promise<T>;
   }
   ```

2. **Constraints When Needed**: Add constraints only when necessary:

   ```typescript
   // Good - ensures T has required methods
   interface DataProcessor<T extends { process(): void }> {
     data: T;
   }
   ```

3. **Default Type Parameters**: Provide defaults when it makes sense:

   ```typescript
   interface Config<T = Record<string, unknown>> {
     data: T;
   }
   ```

## Common Use Cases

1. **Type-Safe Collections**

   ```typescript
   class List<T> {
     private items: T[] = [];
     
     add(item: T): void {
       this.items.push(item);
     }
     
     get(index: number): T {
       return this.items[index];
     }
   }
   ```

2. **API Response Wrappers**

   ```typescript
   interface ApiResponse<T> {
     data: T;
     status: number;
     message: string;
   }
   ```

3. **Factory Functions**

   ```typescript
   function createFactory<T>(defaultValue: T) {
     return {
       create: () => ({ ...defaultValue })
     };
   }
   ```

## Troubleshooting Common Issues

1. **Type Inference**

   ```typescript
   // TypeScript can often infer the type
   const numbers = [1, 2, 3].map(n => n * 2);  // Type: number[]
   
   // Sometimes you need to be explicit
   const parsed = JSON.parse<UserData>(jsonString);
   ```

2. **Constraint Errors**

   ```typescript
   // Error: Type 'string' does not satisfy constraint 'object'
   function processObject<T extends object>(obj: T) {
     return obj;
   }
   processObject("not an object");  // Error!
   ```

3. **Generic Type vs Any**

   ```typescript
   // Don't use any when you can use generics
   function badExample(data: any): any {
     return data;
   }
   
   // Better: preserves type information
   function goodExample<T>(data: T): T {
     return data;
   }
   ```

## Advanced Topics

### Conditional Types

```typescript
type ArrayType<T> = T extends any[] ? T[number] : T;

// Usage
type StringArray = ArrayType<string[]>;  // type is string
type Number = ArrayType<number>;         // type is number
```

### Mapped Types with Generics

```typescript
type Optional<T> = {
  [K in keyof T]?: T[K];
};

// Usage
interface User {
  name: string;
  age: number;
}

type OptionalUser = Optional<User>;  // All fields are optional
```

## Further Reading

- [TypeScript Handbook - Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Deep Dive - Generics](https://basarat.gitbook.io/typescript/type-system/generics)
