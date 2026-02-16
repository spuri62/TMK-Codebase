# AIC-TMK: Text-to-Model (TTM) Pipeline

This repository contains the tools and resources for transforming instructional materials into structured Task-Method-Knowledge (TMK) models, as detailed in our paper.

### TMK Modelling Gem

[Access the TMK Modelling Gem here.](https://gemini.google.com/gem/1gmgzQEAYM1SwuIyN4sI85gImBYeYCEj-?usp=sharing)

### Usage Instructions

To generate a new model draft:

1. Upload your course material (textbooks, transcripts, or PDFs) to the [TMK Modelling Gem](https://gemini.google.com/gem/1gmgzQEAYM1SwuIyN4sI85gImBYeYCEj-?usp=sharing).
2. Enter the following prompt:
> Read the attached PDF and draft a TMK model on [lesson name].

### Validation and Refinement

* **Validate:** The `tmk-syntax-validator` can be used to validate the generated `Task.json`, `Method.json`, and `Knowledge.json`. This static web app contains the official standards-compliant TMK schemata required to ensure structural integrity.
* **Refine:** Current workflows require manual refinement using a text or code editor. Proofread and refine the models, paying special attention to content coverage, causal transitions, state logic, and domain-specific edge cases.
  * **Note:** We are currently developing a more user-friendly application to streamline this refinement process.

### Repository Contents

* **ExampleModels/**: Contains the two primary examples discussed in the paper (Frames, IUPAC Nomenclature). We have included specific commits so viewers can use a 'diff' to compare the 'before' (raw LLM output) and 'after' (expert-refined) versions.
* **EvaluationScripts/**: Contains the scripts used to calculate the semantic similarity results reported in the paper.
* **SystemPrompt/**: Contains the system prompt provided to the TMK Modelling Gem.
* **tmk-syntax-validator/**: The static web app to validate TMK models against the schemata.
