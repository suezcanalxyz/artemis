# ARTEMIS Prompt Pipeline

## Purpose

ARTEMIS outputs must be source-grounded and profile-aware.

The prompt pipeline should combine:

1. Product rules
2. Profile context
3. Request/tool mode
4. Source pack
5. Expert rubric pack
6. Output schema
7. Confidence and missing information rules
8. Review step
9. Saved output

## Required output structure

Every generated output should include:

- summary
- main sections
- sources
- assumptions
- missing information
- confidence level
- suggested next action

## Source rules

Never invent:

- calls
- deadlines
- grants
- collectors
- galleries
- journalists
- prices
- exhibitions
- technical specifications

If sources are insufficient, say what is missing.

## Profile context

Prompts should use:

- profile kind
- language profile
- goals
- capabilities
- archive materials
- knowledge items
- uploaded files
- strategic radar
- privacy constraints

## Expert board

Later, expert rubrics should be injected into the prompt pipeline.

Rubrics can cover:

- portfolio review
- application review
- technical rider standards
- gallery dossier standards
- collector dossier standards
- curatorial proposal standards
- funding application standards
