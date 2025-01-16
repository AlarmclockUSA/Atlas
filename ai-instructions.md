# AI Development Instructions

## General Guidelines
- Wait for explicit instructions before taking any action
- Request clarification immediately if instructions are unclear or ambiguous
- Execute instructions exactly as given without adding extra steps, modifications, or optimizations unless specifically requested
- Request clarification if:
  - Any step is ambiguous
  - Multiple interpretations are possible
  - Required parameters are missing
- Confirm understanding by stating back the interpreted instruction and wait for approval before execution
- Stop at any error, report the exact error encountered, and wait for new instructions before proceeding

## ElevenLabs Integration Guidelines
- Always create additional components for new ElevenLabs functionality
- Do not edit `@ConversationalAI.tsx` unless explicitly instructed to do so
- When you think you've been instructed to modify `@ConversationalAI.tsx`:
  1. Stop and confirm with the user first
  2. Wait for explicit approval before proceeding with any changes
  3. Document the proposed changes before implementation

## Best Practices
- Keep components modular and focused on single responsibilities
- Maintain clear separation of concerns
- Document any new components or functionality added
- Follow existing project structure and naming conventions
- Test new components in isolation before integration 