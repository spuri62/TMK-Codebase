# JSON Schema Scorer

A lightweight utility designed to facilitate **TMK (Task, Method, Knowledge) standardisation** by validating and scoring JSON models against their respective schemata.

### Project Structure

* `index.html`: The web interface featuring a 'Night Mode' UI and control toggles.
* `style.css`: Minimalist styling for dark-themed data entry and reporting.
* `src/validator.js`: Core logic utilising **Ajv** for schema validation and a custom scoring algorithm.
* `/schemata`: Directory containing the canonical `.schema.json` files for Task, Method, and Knowledge.

---

### How it Works

The tool automatically identifies the required schema by inspecting the `model` field within the pasted JSON. It then evaluates the data on a **per-file basis** by default.

#### Configuration Options

| Option | Description |
| --- | --- |
| **Detailed** | Breaks down the total score into field-by-field results with specific logic for missing vs. malformed data. |
| **Raw** | Outputs the unprocessed Ajv validation error array for debugging complex schema violations. |
| **Fix** | Automatically normalises trivial case mismatches (e.g., 'METHOD' to 'Method') and synchronises the input textbox. |

---

### Scoring Rubric

The scoring system evaluates models on a per-field basis, awarding up to 2 points for every property defined in the schema.

| Field Status | Required Field | Non-Required (Optional) |
| --- | --- | --- |
| **Correct** | **2 pts** (Included, correct type) | **2 pts** (Included, correct type) |
| **Malformed** | **1 pt** (Included, wrong type) | **1 pt** (Included, wrong type) |
| **Omitted** | **0 pts** (Missing) | **2 pts** ('Vacuously' correct) |

---

### Logic Notes

* **Vacuous Truths:** To prevent penalising concise models, optional fields that are omitted receive full marks. This avoids spurious deductions for simply not utilising an optional feature.
* **Presence Reward:** Any field that is physically present but fails validation still receives **1 point**. This acknowledges the attempt to include the data while highlighting the syntax or type error.
* **Max Score:** The total potential score is $2n$, where $n$ is the total number of properties defined in the schema, regardless of whether they are marked as required.

---

### Scope and Limitations

* **Syntactic Only:** This tool focuses on structural integrity and data types.
* **No Semantic Analysis:** It does **not** evaluate the meaning or logic of the model content.
* **No Content Correction:** Beyond fixing casing issues, the tool does not alter the factual or descriptive content of the JSON.
