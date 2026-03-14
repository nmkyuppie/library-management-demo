import { spawn } from "child_process";
import { StringDecoder } from "string_decoder";

// 1. Start pi in RPC mode
// --no-session: ephemeral mode (optional)
const pi = spawn("pi", ["--mode", "rpc", "--no-session"], { shell: true });

// Helper to handle the JSONL protocol (streams chunks into full JSON lines)
function handleOutput(stream) {
    const decoder = new StringDecoder("utf8");
    let buffer = "";

    stream.on("data", (chunk) => {
        buffer += decoder.write(chunk);

        // Split by newline
        let lines = buffer.split("\n");
        // Keep the last partial line in the buffer
        buffer = lines.pop();

        for (let line of lines) {
            if (!line.trim()) continue;
            try {
                const event = JSON.parse(line);
                onEvent(event);
            } catch (e) {
                console.error("Failed to parse JSON:", line);
            }
        }
    });
}

// 2. Process events from pi
function onEvent(event) {
    // There are many event types (tool_execution, turn_start, etc.)
    // Here we focus on text updates and the end of the run

    if (event.type === "message_update") {
        const delta = event.assistantMessageEvent;
        if (delta && delta.type === "text_delta") {
            // Write the chunk to stdout without a newline to "stream" it
            process.stdout.write(delta.delta);
        }
    }

    if (event.type === "agent_end") {
        console.log("\n\n--- Done ---");
        pi.kill(); // Close the process when finished
        process.exit();
    }

    if (event.success === false) {
        console.error("\nError from Pi:", event.error);
    }
}

// 3. Attach the listeners
handleOutput(pi.stdout);
pi.stderr.on("data", (data) => {
    // Note: pi might output some non-JSON info messages to stderr on startup
    const msg = data.toString();
    if (!msg.includes("ExperimentalWarning")) {
        console.error(`Stderr: ${msg}`);
    }
});

// 4. Send the prompt command via stdin
const command = {
    type: "prompt",
    message: "Write a short poem about coding in the terminal."
};

console.log(`Sending prompt: "${command.message}"\n`);
pi.stdin.write(JSON.stringify(command) + "\n");
