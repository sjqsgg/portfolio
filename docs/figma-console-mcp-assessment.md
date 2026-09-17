# Figma Console MCP Assessment

Evaluated repository: https://github.com/southleft/figma-console-mcp

Evaluation date: 7 September 2026

Observed package version: 1.40.0

## Conclusion

This is a credible alternative connection path for the current project. It should avoid the specific Starter tool-call quota encountered in the bundled Figma MCP because it runs a separate MCP server and sends write operations to a Desktop Bridge plugin inside Figma.

This is not additional quota for the bundled Figma connector. It is a different integration with its own setup, permissions, possible bugs, and maintenance burden.

Recommended mode for this project: **local NPX mode with the Desktop Bridge plugin**.

Reasons:

- Full create and edit access.
- Local stdio connection between Codex and the MCP server.
- Direct local WebSocket bridge to Figma Desktop.
- No need to send design operations through the project's cloud relay.
- The repository includes dedicated Codex setup instructions.
- Automatic package updates are available when using `@latest`, although pinning a tested version is safer once the workflow is stable.

## What it provides

The repository describes a broad Figma toolset including:

- Read and write access to frames, components, and layouts.
- Screenshots and visual debugging.
- Arbitrary Figma Plugin API execution through `figma_execute`.
- Variables and design-token workflows.
- Component and design-system extraction.
- Accessibility and design-system audits.
- FigJam and Figma Slides operations.
- Desktop selection, change, and console monitoring in local mode.

This is more capable than required for the current homepage wireframe. For this project, the useful minimum is:

- Status and diagnostics.
- Screenshot capture.
- File and node inspection.
- `figma_execute` or equivalent creation/edit tools.
- Selection tracking while iterating.

## Why it may solve the current blocker

The quota error came from the currently installed bundled Figma MCP service. Figma Console MCP is independently hosted and, in local mode, runs through:

```text
Codex -> local MCP process -> localhost WebSocket -> Figma Desktop Bridge -> open Figma file
```

Because the file edits are executed through the locally running bridge, they should not count against the bundled connector's Starter call allowance.

This is an inference from the two tools' separate architectures, not a guarantee published by Figma. Normal Figma product restrictions, Personal Access Token limits, plugin behavior, and API rate limits may still apply.

## Local machine readiness

Verified on this machine:

- Node.js: v20.11.0.
- Required minimum in the repository: Node.js 18+.
- Figma Desktop: installed in `/Applications/Figma.app`.
- Codex CLI: supports adding stdio MCP servers with a command, arguments, and environment variables.

Still required from the user:

- A Figma Personal Access Token beginning with `figd_`.
- Importing the generated Desktop Bridge manifest into Figma Desktop.
- Running the Desktop Bridge plugin in the file being edited.
- Restarting Codex or opening a new task after the MCP configuration is added, because tools do not appear retroactively in the current task.

## Minimal-permission token recommendation

Follow the repository's documented minimum:

- File content: read.
- Variables: read, only if needed.
- Comments: read and write, only if comment tools are needed.

Leave unrelated scopes disabled. The Desktop Bridge performs design writes inside the currently open file through the Figma Plugin API, so a broadly privileged REST token is not required for basic canvas editing.

Never commit the token to this repository. Store it in Codex's MCP environment configuration or an external environment file outside the project.

## Security assessment

Positive characteristics claimed by the project:

- MIT-licensed and auditable source code.
- Local mode uses stdio and localhost WebSocket communication.
- The project states that local mode does not persist design data or collect telemetry.
- Plugin code executes inside Figma's plugin sandbox.
- The bridge can only act on the currently open file and must be manually running.
- Figma version history provides a recovery path for design changes.

Important risks:

- `figma_execute` can make arbitrary changes to the open Figma file.
- `npx -y figma-console-mcp@latest` downloads and executes the newest published package, creating supply-chain and unexpected-update risk.
- A Personal Access Token is available to the local MCP process.
- Cloud mode sends commands through infrastructure operated by the project maintainer and is unnecessary for this local setup.
- Repository security statements are maintainer claims, not an independent audit.
- A very large tool surface increases the chance of accidental or over-broad operations.

Mitigations:

- Use local mode, not Cloud mode.
- Test first in a duplicate Figma file or rely on a named version checkpoint.
- Start the Bridge only while actively working.
- Use the minimum token scopes.
- Keep the token outside the repository.
- After a successful trial, pin the package to the tested version instead of permanently using `@latest`.
- Ask the agent to inspect and modify explicit node IDs and return all changed IDs.
- Take a screenshot after each meaningful write.
- Stop after the first tool error and inspect before retrying.

## Proposed installation sequence

Do not run this until the user authorizes installation and supplies their own token through Codex settings.

1. In Figma, create a minimum-scope Personal Access Token.
2. In Codex Settings, add an MCP server named `figma-console`.
3. Command: `npx`.
4. Arguments: `-y`, `figma-console-mcp@1.40.0` for a pinned trial.
5. Environment variable: `FIGMA_ACCESS_TOKEN` with the user's token.
6. Optionally add `ENABLE_MCP_APPS=true`. It is not required for basic design writes.
7. Restart Codex or open a new task so the newly configured tools are loaded.
8. Start the MCP once so it creates `~/.figma-console-mcp/plugin/manifest.json`.
9. In Figma Desktop, import that manifest through Development Plugins.
10. Open the portfolio Figma file and run the Desktop Bridge plugin.
11. In a new Codex task, request a status check.
12. Perform a reversible test in a duplicate frame, such as creating a small labeled rectangle.
13. Verify the change and take a screenshot.
14. Only then use it for the homepage V2 rewrite.

## Decision

Recommended: proceed with a cautious local trial.

Do not install it solely as a permanent quota workaround without the test above. The better framing is that it gives us a locally controlled Figma automation path with stronger write and debugging capabilities. Avoiding the bundled connector quota is a useful side effect.
