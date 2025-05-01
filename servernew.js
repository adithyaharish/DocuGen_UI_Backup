require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const morgan = require('morgan');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Environment variables
const OPENAI_API_KEY = "";
const ML_API_URL = "https://docgen-arm.onrender.com/default-doc";
const GPT_API_URL = "https://api.openai.com/v1/chat/completions";

// Generate documentation endpoint
app.post('/generate-docs', async (req, res) => {
    try {
        console.log("Received request to /generate-docs");
        const { githubLink, persona, branch } = req.body;

        console.log("Request body:", req.body);

        // Validate input
        if (!githubLink || !persona) {
            console.log("Missing githubLink or persona parameter");
            return res.status(400).json({ error: "Missing githubLink or persona parameter" });
        }

        // Call ML API
        let mlResponse;
        try {
            console.log(`Calling ML API at ${ML_API_URL}`);
            mlResponse = await axios.post(ML_API_URL, {
                repo_url: githubLink,
                branch: branch
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            console.log("ML API Response:", mlResponse.data);
        } catch (error) {
            console.error("ML API Connection Failed:", error);
            return res.status(502).json({
                error: "Connection to documentation service failed",
                details: error.message
            });
        }

        // Process ML API response
        const mlData = mlResponse.data;
        if (!mlData.summaries) {
            console.log("Invalid documentation service response: Missing summaries");
            return res.status(502).json({
                error: "Invalid documentation service response",
                details: "Missing required field: summaries"
            });
        }

        // Create summary content
        const summaryContent = mlData.summaries.map(item =>
            `File: ${item.file}\nSummary: ${item.summary}`
        ).join('\n\n');

        // Create persona-specific prompt
        let textPrompt;
        switch (persona.toLowerCase()) {
            case 'beginner':
                textPrompt = createBeginnerPrompt(summaryContent);
                break;
            case 'intermediate':
                textPrompt = createIntermediatePrompt(summaryContent);
                break;
            case 'expert':
                textPrompt = createExpertPrompt(summaryContent);
                break;
            default:
                console.log("Invalid persona specified");
                return res.status(400).json({ error: "Invalid persona specified" });
        }

        console.log("Generated text prompt:", textPrompt);

        // Call OpenAI API
        let gptResponse;
        try {
            console.log(`Calling GPT API at ${GPT_API_URL}`);
            gptResponse = await axios.post(GPT_API_URL, {
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: textPrompt }
                ],
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log("GPT API Response:", gptResponse.data);
        } catch (error) {
            console.error("GPT API Connection Failed:", error);
            return res.status(502).json({
                error: "Connection to GPT service failed",
                details: error.message
            });
        }

        const gpt_summary = gptResponse.data.choices[0].message.content;

        console.log("Generated GPT Summary:", gpt_summary);
        res.json({
            gpt_summary: gpt_summary,
            branches: mlData.branches || []
        });

    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
});

// Chat endpoint for documentation refinement
app.post('/chat', async (req, res) => {
    try {
        console.log("Received request to /chat");
        const { userMessage, documentation } = req.body;

        console.log("Request body:", req.body);

        if (!userMessage || !documentation) {
            console.log("Missing userMessage or documentation parameter");
            return res.status(400).json({ error: "Missing userMessage or documentation parameter" });
        }

        const prompt = `
You are reviewing this software documentation:

${documentation}

The user has asked: "${userMessage}"

✅ Instead of rewriting everything, return ONLY the changes, clarifications, or additions needed.
✅ Use bullet points or markdown sections like "### Revised: get_analysis".
❌ DO NOT repeat unchanged parts.
Your goal is to show *only what's new or improved* based on the user's question.
`;




        console.log("Generated chat prompt:", prompt);

        const gptResponse = await axios.post(GPT_API_URL, {
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("GPT API Response:", gptResponse.data);

        const refinedDoc = gptResponse.data.choices[0].message.content;

        console.log("Refined documentation:", refinedDoc);
        res.json({
            chatResponse: refinedDoc
        });

    } catch (error) {
        console.error("Chat endpoint error:", error);
        res.status(500).json({
            error: "Internal server error in chat endpoint",
            details: error.message
        });
    }
});

// Prompt creation functions
function createBeginnerPrompt(summaryContent) {
    return `You are tasked with providing a *beginner-friendly documentation summary* for the following data:\n${summaryContent}\n\nThe user is a beginner, so the explanation should be *clear, simple, and easy to follow. Avoid using technical jargon, and provide **step-by-step instructions* with simple examples.\n\nHere's how the documentation should be structured:\n\n### 1. *Introduction*\nBriefly describe what the project does and its *main benefits*.\n\n### 2. *Prerequisites*\nList all *requirements* to get started.\n\n### 3. *Installation Guide*\nProvide *step-by-step installation instructions*.\n\n### 4. *Quick Start*\nOffer a simple example to get something working immediately.\n\n### 5. *Basic Concepts*\nExplain the *fundamental terms* and concepts.\n\n### 6. *Common Use Cases*\nShow 2-3 simple examples of how the project can be used.\n\n### 7. *Troubleshooting*\nOffer solutions to common beginner problems.\n\n### 8. *FAQs*\nAnswer frequently asked questions.`;
}

function createIntermediatePrompt(summaryContent) {
    return `You are tasked with providing a *standard-level documentation summary* for the following data:\n${summaryContent}\n\nThe user has intermediate knowledge, so the explanation should be technical but approachable.\n\nHere's how the documentation should be structured:\n\n### 1. *Architecture Overview*\nExplain how the main components fit together.\n\n### 2. *Complete API Reference*\nList all public methods/functions with details.\n\n### 3. *Configuration Options*\nDescribe configurable options with examples.\n\n### 4. *Intermediate Tutorials*\nProvide a more complex example for advanced features.\n\n### 5. *Best Practices*\nDescribe recommended patterns and approaches.\n\n### 6. *Performance Considerations*\nOffer guidance on optimizing the project.\n\n### 7. *Integration Guides*\nExplain how to integrate with other systems.\n\n### 8. *Migration Guide*\nProvide instructions on upgrading from previous versions.`;
}

function createExpertPrompt(summaryContent) {
    return `You are tasked with providing an *expert-level documentation summary* for the following data:\n${summaryContent}\n\nThe user is an expert, so the explanation should be brief, highly technical, and focused on advanced topics.\n\nHere's how the documentation should be structured:\n\n### 1. *Internals Deep Dive*\nExplain the system's internals, including key algorithms and design decisions.\n\n### 2. *Extending the Project*\nDescribe how to extend the system with custom plugins or features.\n\n### 3. *Contributing Guide*\nProvide guidelines for contributing to the project.\n\n### 4. *Advanced Customization*\nDetail how to customize core functionality.\n\n### 5. *Security Considerations*\nDiscuss security best practices and risk mitigation.\n\n### 6. *Benchmarks and Optimization*\nProvide performance benchmarks and optimization tips.\n\n### 7. *Design Decisions*\nExplain key architectural decisions.\n\n### 8. *Edge Cases*\nDiscuss handling of edge cases and rare scenarios.`;
}

// // Error handler
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ error: 'Something broke!' });
// });

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

// const path = require('path');
// app.use(express.static(path.join(__dirname, 'build')));

// app.get(/(.*)/, (req, res) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
//   });



  // Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
  

