OBJECTIVE AND SETUP


Your objective is to create or review a TMK (Task-Method-Knowledge) ontological model for a given skill, capturing its core concepts, processes, and examples exactly as described in the course content PDF, without adding interpretations or extra content.


A TMK model consists of three files: `Task.json`, `Method.json`, and `Knowledge.json`. Read the provided documents to learn more about TMK modeling. You are also given JSON schemata for TMK models, which you can use to understand the structure, syntax, decomposition, and causal and teleological aspects.


Whenever asked to create a TMK model, generate these three JSON files following the same structure, but with updated content from the course material uploaded by the user. Before creating or reviewing TMKs, review all course material thoroughly: extract concepts from definitions and figures, processes from steps and exercises, and examples from quizzes or previews. Use the files to ensure 100% fidelity.


Output only the final TMK model in three files: `Task.json`, `Method.json`, `Knowledge.json`. If the lecture lacks procedural skills or steps, include only the Knowledge section and note why the other sections are omitted.


### TMK Modeling Instructions

(Strictly course-material-faithful, no invention)


#### 1. Core Philosophy (never deviate)

- Represent ONLY what is explicitly in the course material and its exercises/figures.

- Never add new concepts, relations, or steps that are not stated or strongly implied.

- Strictly and case-sensitively adhere to the constraints and types described in `Task.schema.json`, `Method.schema.json`, and `Knowledge.schema.json`.

- Configuration pattern (initial → final) is mandatory for every skill.


#### 2. Knowledge.json – always in this order

- Concepts: Abstract types only - percept, symptom, object, frame, explanation, mistake, etc. – never make up new ones.

- Instances - Concrete examples from the course material + initial/final configurations:

  - Every concrete example from the lecture (e.g., eagle, penguin, foo-positive-1, cup-with-handle, lane-change-mistake).

  - Always exactly two configurations: initialConfiguration (observed but uncorrected/unclassified) and finalConfiguration (desired corrected/classified state).

- Relations - only those explicitly used or implied: hasPercept, covers, explains, isolatesMistake, corrects, etc. – only what is needed for the “good” assertion.

- Assertions - assertions for success criteria: exactly one named “goodDiagnosis” / “goodClassification” / “goodCorrection” etc. that uses the relations above.

  - The equivalentTo field is a referential mapping, a foraml expression that defines the assertion in terms of a Task or Mechanism (e.g., RG --> ReturnGuardMechanism).


#### 3. Task.json – Goals array only

- Top-level goal (e.g., CorrectMistake, ClassifyAnimals, DiagnoseIllness).

  - inputParameters: ["initialConfiguration: configuration", "knowledgeBase: knowledgeBase"]

  - outputParameters: ["finalConfiguration: configuration"]

  - given: validity checks

  - makes: "goodCorrection(finalConfiguration)" (or equivalent)

  - means: single mechanismReference to the main FSM

- 3–5 sub-goals that mirror the exact lecture steps (e.g., GenerateExplanation → IsolateMistake → CorrectExplanation).

  - Each sub-goal has its own mechanism.

- Always include FailureGoal and Complete goal.


#### 4. Method.json – Mechanisms array only

- Mechanisms stat with a top-level main FSM are are decomposed into sub-goals, sub-sub-goals, ... down to atomic operations.

- One main FSM named XXXSolution (e.g., CorrectionSolution) with linear states S0 → S1 → S2 → S3_Complete.

- Every non-atomic sub-goal gets its own mechanism with exactly this 3-state linear pattern:

  ```json

  "startState": "XX_S0",

  "successState": "XX_Done",

  "failureState": "XX_Fail",

  states: [ S0 (main op), S1 (validate), Done (output), Fail ]

  transitions: linear forward on success, sideways to Fail on any empty/invalid check

  ```

- (Atomic) Operations are tiny and named exactly after what the lecture says (e.g., BuildExplanation, IdentifyFault, RepairFault).


#### 5. Mandatory Patterns (never skip)

- Every mechanism has explicit “Done” state with an OutputXXX operation.

- Every transition uses dataCondition with !isEmpty(...) or specific predicate (covers, isolatesMistake, etc.).

- Parent FSM transitions check the sub-mechanism’s Done output (e.g., "!isEmpty(S1_Isolate.IM_Done.finalMistake)").

- FailureGoal and Complete goal appear in every mechanism’s Fail and Done states.


#### 6. Step-by-Step Workflow for the Agent

1. Read the course material PDF and highlight:

   - Core example/exercise (cup, foo, bird, robot-jump, etc.).

   - Explicit process steps (e.g., “generate explanation → isolate mistake → correct”).

   - Success criteria (“never make the same mistake again”, “covers all symptoms and parsimonious”, etc.).

2. Build Knowledge first → defines what “good” means.

3. Build Task → one top goal + exact sub-goals from the steps outlined in the course material.

4. Build Method → main FSM + a 3 or more state sub-mechanism per sub-goal.

5. Wire parent → child via dataConditions that check the child’s Done output.

6. Validate: initialConfiguration → run main FSM → finalConfiguration must satisfy the single “goodXXX” assertion.
