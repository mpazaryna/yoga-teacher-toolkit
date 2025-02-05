# Yoga Teacher Toolkit

A sophisticated TypeScript application designed to assist yoga teachers in creating, analyzing, and customizing yoga sequences for their classes, with special attention to senior practitioners. This tool leverages Large Language Models (LLMs) and robust software design patterns to generate well-structured, safe, and effective yoga sequences.

## Overview

The Yoga Sequence Generator combines deep domain knowledge of yoga teaching with modern software architecture to create a powerful tool for yoga teachers. It generates sequences based on specific parameters such as:

- Class duration
- Difficulty level
- Focus areas
- Student demographics (with special attention to senior practitioners)
- Teaching style preferences

## Technical Implementation

The application is built using TypeScript and implements several Gang of Four (GoF) design patterns to ensure maintainability, extensibility, and type safety:

### 1. Strategy Pattern

- Handles different content types (yoga sequences, dharma talks) through specialized handlers
- Each content type encapsulates its validation and formatting logic
- Enables runtime strategy selection based on content type
- Maintains type safety across different strategies

### 2. Template Method Pattern

The content generation follows a well-defined algorithm with both invariant and customizable steps:

1. Context Validation (customizable per content type)
2. Template Loading (common infrastructure)
3. Content Generation (common LLM interaction)
4. Output Formatting (customizable per content type)

### 3. Factory Method Elements

- Type-safe content object creation
- Proper type discrimination throughout the generation pipeline
- Seamless integration with content handlers

## Features

1. **Sequence Generation**
   - Create yoga sequences based on customizable parameters
   - Intelligent pose selection and sequencing
   - Duration management and pacing suggestions

2. **Senior Practitioner Focus**
   - Specialized modifications for senior practitioners
   - Safety considerations and contraindications
   - Progressive difficulty adjustments

3. **Content Customization**
   - Template-based generation system
   - Style and tradition-specific variations
   - Integration with dharma talks and themes

4. **Type Safety**
   - Comprehensive TypeScript type system
   - Compile-time validation
   - Enhanced IDE support and documentation

## Configuration

The system supports various configuration options through JSON files:

- `data/config/setlist.json`: Sequence configurations
- `data/config/dharma-config.json`: Dharma talk settings
- `data/templates/`: Template files for content generation

## Architecture

The application follows SOLID principles and implements a robust type system:

- **Single Responsibility**: Each component handles one specific aspect of sequence generation
- **Open/Closed**: Easily extensible for new content types and features
- **Liskov Substitution**: Consistent behavior contracts across content handlers
- **Interface Segregation**: Clear separation of concerns
- **Dependency Inversion**: Pluggable components and abstractions

## License

[Add your license information here]

## Acknowledgments

- Yoga tradition and philosophy
- Gang of Four design patterns
- TypeScript and modern software development practices

