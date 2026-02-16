// Ajv core: A JSON schema validator
import Ajv from 'https://esm.sh/ajv@8.12.0';
// Ajv formats: Additional format support for Ajv (e.g., email, URI, date-time)
import addFormats from 'https://esm.sh/ajv-formats@2.1.1';

// Quickie to change a string to title case
function toTitleCase(str) {
  // Each Word Starts Uppercase
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// Helper to normalise cases
function normaliseCase(data, schema) {
  // Get the schema properties
  const properties = schema.properties || {};
  // Keys to the kingdom (of Ivy)
  const keys = Object.keys(data);
  // We will preserve ordering, but return corrected data
  const corrected = {};

  // For each key pair
  for (const k of keys) {
    // The value of the key
    let value = data[k];
    // Key correction, e.g. 'Model' to 'model'
    // Find a case-insensitive match (the canonical schema key)
    const canonical = Object.keys(properties).find(p => p.toLowerCase() === k.toLowerCase()) || k;

    // Value correction if enum
    const def = properties[canonical];
    
    // If a string and defined in the schema
    if (typeof value === 'string' && def && def.enum && Array.isArray(def.enum)) {
      // Case-insensitive match
      const match = def.enum.find(v => v.toLowerCase() === value.toLowerCase());
      // If found
      if (match) {
        // Overwrite with the data field
        value = match;
      }
    }

    // Recurse into the nested objects/arrays if the schema says so (helps fix non-top-level errors)
    // If an object
    if (def && def.type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
      // Normalise the case of the value (recurse)
      value = normaliseCase(value, def);
    } else if (def && def.type === 'array' && Array.isArray(value) && def.items) { // If array
      // Recurse on each object
      value = value.map(item =>
        typeof item === 'object' ? normaliseCase(item, def.items) : item
      );
    }

    // Use the schema's canonical key
    corrected[canonical] = value;
  }
  // Corrected data
  return corrected;
}

// Create a new Ajv instance with options:
// - allErrors: true ensures all validation errors are reported, not just the first
// - strict: false disables strict mode, allowing more leniency in schema definitions
const ajv = new Ajv({ allErrors: true, strict: false });
// Add support for common formats (e.g., regex patterns for emails, dates, etc.)
addFormats(ajv);

// Load Task, Method, Knowledge schemata asyncly
async function loadSchemata() {
  // Our three filenames
  const names = ['Task', 'Method', 'Knowledge'];
  const loaded = {};
  // Asyncly fetch from the correct directory
  for (const name of names) {
    const resp = await fetch(`./schemata/${name}.schema.json`);
    loaded[name] = await resp.json();
  }
  return loaded;
}

/**
 * Validate JSON against a chosen schema
 * @param {Object} data - The JSON object to validate
 * @param {'Task'|'Method'|'Knowledge'} schemaName - Which schema to use
 * @returns {{ valid: boolean, errors?: any }}
 */
// Function to validate a given JSON object against a specified schema
function validateJSON(data, schemaName) {
  // Retrieve the validator function for the requested schema
  const validate = validators[schemaName];
  // If the schema name is not recognised, throw an error
  if (!validate) {
    throw new Error(`Unknown schema: ${schemaName}`);
  }

  // Run the validator against the provided data
  const valid = validate(data);
  // Return an object indicating whether validation passed
  // If invalid, include the list of errors
  return valid ? { valid } : { valid, errors: validate.errors };
}

/**
 * 'Bond, James Bond'-level refined scoring using Ajv per-field validation
 * Calculates a numerical score for a JSON object based on its adherence to a schema.
 * @param {Object} data - The actual JSON data to be evaluated.
 * @param {Object} schema - The JSON schema used as the benchmark for validation.
 * @param {boolean} [detailed=false] - If true, returns a field-by-field breakdown.
 * @returns {Object} An object containing the total score, maximum potential score, and optional field details.
 */
function scoreJSON(data, schema, detailed = false) {
  // Initialise the running tally and total possible points
  let score = 0;
  let max = 0;
  // Convert required fields into a Set for efficient, O(1) lookups
  const required = new Set(schema.required || []);
  // Access the properties defined in the schema, defaulting to an empty object if none exist
  const properties = schema.properties || {};
  // Initialise an object to store individual field results for detailed reporting
  const fields = {};

  // Iterate through each field definition within the schema's properties
  for (const [field, def] of Object.entries(properties)) {
    // Increment the maximum possible score by 2 for every property checked
    max += 2;
    // Check if the data object is missing the current field
    if (data[field] === undefined) {
      if (required.has(field)) {
        // Required but missing: 0
        if (detailed) fields[field] = { score: 0, max: 2, reason: '<span class="status-red">Missing required field</span>' };
      } else {
        // Not required and missing: full points
        score += 2;
        if (detailed) fields[field] = { score: 2, max: 2, reason: '<span class="status-green">\'Vacuously\' correct</span>' };
      }
      // Skip further validation logic for this field as it does not exist
      continue;
    }

    // Construct a temporary schema to validate this specific field in isolation
    const fieldSchema = { type: 'object', properties: { [field]: def }, required: required.has(field) ? [field] : [] };
    // Compile the schema using the AJV library
    const validateField = ajv.compile(fieldSchema);
    // Execute the validation against the specific data value
    const valid = validateField({ [field]: data[field] });

    // Award 2 points for valid data; 1 point for presence but failed validation (malformed)
    const fieldScore = valid ? 2 : 1;
    score += fieldScore;
    // Map the results to the fields object if a detailed breakdown is requested
    if (detailed) {
      let reason;
      if (data[field] === undefined) {
        reason = required.has(field) ? '<span class="status-red">Missing required field</span>' : '<span class="status-green">\'Vacuously\' correct</span>';
      } else if (valid) {
        reason = '<span class="status-green">Correct type</span>';
      } else {
        // Use Ajv's first error message for this field if available
        const err = validateField.errors?.find(e => e.instancePath.startsWith(`/${field}`) || e.instancePath === '');
        reason = `<span class="status-red">${err ? `\`${err.keyword}\` - ${err.message}` : 'Validation failed'}</span>`;
      }
      fields[field] = { score: fieldScore, max: 2, reason };
    }
  }

  // Return the final result set, conditionally including the detailed field breakdown
  return detailed ? { score, max, fields } : { score, max };
}

let validators;
let schemata;

(async () => {
  // Load the schemata once
  schemata = await loadSchemata();

  // Compile validators
  // Convert the schemata object into an object of compiled validator functions
  // Each schema is compiled by Ajv into a function that can validate data against it
  validators = Object.fromEntries(
    Object.entries(schemata).map(([name, schema]) => [name, ajv.compile(schema)])
  );

  // --- BROWSER EVENT LOGIC ---

  // Checkbox buttons
  // Correspond to --flags on the CLI
  const runBtn = document.getElementById('runBtn');
  const jsonInput = document.getElementById('jsonInput');
  const output = document.getElementById('output');

  // When 'run' is click
  runBtn.addEventListener('click', () => {
    try {
      // 1. Read JSON input from textbox
      let data = JSON.parse(jsonInput.value);

      // 2. Pick schema from 'model' field
      let schemaName = data.model;

      // 3. Use checkbox values instead of CLI flags
      const detailed = document.getElementById('detailed').checked;
      const raw = document.getElementById('raw').checked;
      const fix = document.getElementById('fix').checked;

      // Conditionally fix the input
      if (fix) {
        // Dummy schema for normalising the model
        const dummyTMKschema = {
          type: "object",
          properties: {
            model: { type: "string", enum: Object.keys(schemata) }
          }
        }

        // First, normalise just the 'model' field using the dummy schema
        data = normaliseCase(data, dummyTMKschema);
        schemaName = data.model;

        // Normalise cases before validation
        data = normaliseCase(data, schemata[schemaName]);
        // Write back the case-normalised JSON to the textbox
        jsonInput.value = JSON.stringify(data, null, 2);
      }

      // The matching schema doesn't exist (and the logic above couldn't fix it either)
      if (!schemaName || !validators[schemaName]) {
        throw new Error(`Invalid or missing "model" field. Must be Task, Method, or Knowledge.`);
      }

      // Validate
      const result = validateJSON(data, schemaName);

      // Score
      const { score, max, fields } = scoreJSON(data, schemata[schemaName], detailed);

      // Report
      let html = `<h3>Results for ${schemaName}</h3>`;
      // Status colour class
      const statusClass = result.valid ? 'status-green' : 'status-red';
      // Report the status
      html += `<p><strong>Status:</strong> <span class="${statusClass}">${result.valid ? '✅ VALID' : '❌ INVALID'}</span></p>`;
      // Raw JSON validation errors
      if (!result.valid && raw) {
        html += `<pre>${JSON.stringify(result.errors, null, 2)}</pre>`;
      }
      // Scores (per-file)
      html += `<p><strong>Score:</strong> ${score} / ${max}</p><hr>`;

      // Detailed (per-field) scores
      if (detailed && fields) {
        // Report as a list under the per-file score
        html += '<ul>';
        // Report individual scores for each field with the reason for scoring it thus
        for (const [f, info] of Object.entries(fields)) {
          html += `<li><strong>${f}</strong>: ${info.score}/${info.max} (${info.reason})</li>`;
        }
        html += '</ul>';
      }

      // Styling (night mode)
      output.innerHTML = html;
      output.style.color = "#aaaaaa";

    } catch (err) { // Catch-all error
      output.innerHTML = `<strong>Error:</strong> ${err.message}`;
      output.style.color = "red";
    }
  });
})();
