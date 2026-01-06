import assert from 'node:assert';
import { tools as workflowTools } from './src/tools/workflowTools.js';
import { n8nKnowledgeTools } from './src/tools/n8nKnowledgeTools.js';
import { optigemTools } from './src/tools/optigemTools.js';
import { sherlockTools } from './src/tools/sherlockTools.js';

console.log("🧪 STARTING MCP TOOL RESPONSE FORMAT TEST");
console.log("=========================================");

async function testToolStructure(tool, args = {}) {
    console.log(`\n🔍 Testing tool: ${tool.name}`);
    try {
        const result = await tool.handler(args);
        
        // Check Top-Level Structure
        assert.ok(result.content, "Result must have 'content' property");
        assert.ok(Array.isArray(result.content), "'content' must be an array");
        assert.ok(result.content.length > 0, "'content' must not be empty");
        
        // Check Item Structure
        const item = result.content[0];
        assert.strictEqual(item.type, "text", "Item type must be 'text'");
        assert.strictEqual(typeof item.text, "string", "Item text must be a string");
        
        // Check JSON validity of text
        try {
            const parsed = JSON.parse(item.text);
            // Check if it's an error response
            if (result.isError) {
                console.log("   ⚠️  Received Expected Error Response (Valid)");
                assert.ok(parsed.error, "Error response must contain 'error' field");
            } else {
                console.log("   ✅ Received Success Response (Valid)");
            }
        } catch (e) {
            assert.fail("Item text must be valid JSON string");
        }

    } catch (e) {
        console.error(`   ❌ FAIL: Unexpected error during test execution:`, e);
        process.exit(1);
    }
}

async function run() {
    // 1. Test Workflow Tools
    const listWorkflows = workflowTools.find(t => t.name === 'list_workflows');
    await testToolStructure(listWorkflows);

    // 2. Test Error Handling (Invalid ID)
    const getWorkflow = workflowTools.find(t => t.name === 'get_workflow');
    await testToolStructure(getWorkflow, { id: 'invalid-id' });

    // 3. Test Knowledge Tools
    const searchKn = n8nKnowledgeTools.find(t => t.name === 'search_n8n_knowledge');
    await testToolStructure(searchKn, { query: 'test' });

    // 4. Test Optigem Tools
    const queryOptigem = optigemTools.find(t => t.name === 'query_optigem');
    await testToolStructure(queryOptigem, { query: 'test' });

    // 5. Test Sherlock
    const getIncidents = sherlockTools.find(t => t.name === 'get_error_incidents');
    await testToolStructure(getIncidents);

    console.log("\n=========================================");
    console.log("🎉 ALL FORMAT TESTS PASSED");
}

run();
