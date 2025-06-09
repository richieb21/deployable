# Cursor Prompt Generation Feature

## Overview

This feature adds the ability to generate Cursor IDE-compatible prompts from code quality issues. Users can click a "Generate Prompt" button beside the "Create Issue" button to generate a well-formatted prompt that they can copy and paste directly into Cursor to fix the identified issue.

## System Architecture

### Backend Components

- **API Endpoint**: `/api/prompt/generate` - Generates formatted prompts for Cursor
- **Prompt Service**: Handles prompt template generation and formatting
- **Issue Analysis**: Analyzes the issue data to create contextual prompts

### Frontend Components

- **Generate Prompt Button**: New button in IssueItem component
- **Prompt Modal/Popup**: Displays the generated prompt with copy functionality
- **Clipboard Integration**: Copy-to-clipboard functionality

## API Design

### Generate Prompt Endpoint

```
POST /api/prompt/generate
```

**Request Body:**

```json
{
  "title": "string",
  "description": "string",
  "file_path": "string",
  "severity": "string",
  "category": "string",
  "action_items": ["string"],
  "code_snippets": {
    "before": "string",
    "after": "string"
  },
  "references": ["string"]
}
```

**Response:**

```json
{
  "prompt": "string",
  "generated_at": "timestamp"
}
```

### Prompt Template Structure

The generated prompt will follow this structure:

````
Fix the following code quality issue:

**Issue**: [Title]
**File**: [File Path]
**Severity**: [Severity Level]
**Category**: [Category]

**Description**:
[Detailed description of the issue]

**Action Items**:
- [Action item 1]
- [Action item 2]
...

**Current Code** (if available):
```[language]
[code snippet before]
````

**Expected Code** (if available):

```[language]
[code snippet after]
```

**References**:

- [Reference 1]
- [Reference 2]
  ...

Please analyze the code and implement the necessary changes to resolve this issue. Make sure to:

1. Follow best practices for [category]
2. Maintain code readability and consistency
3. Add appropriate comments where necessary
4. Test the changes thoroughly

```

## File Structure and Implementation

### Backend Files

#### `/backend/app/api/endpoints/prompt.py`
- New FastAPI router for prompt generation
- Handles prompt generation requests
- Input validation and error handling

#### `/backend/app/services/prompt_service.py`
- Core prompt generation logic
- Template management
- Formatting utilities

#### `/backend/app/models/prompt.py`
- Pydantic models for prompt requests/responses
- Validation schemas

### Frontend Files

#### `/frontend/src/app/components/display/IssueItem.tsx`
- Add "Generate Prompt" button
- Handle button click events
- Integrate with prompt modal

#### `/frontend/src/app/components/shared/PromptModal.tsx`
- New modal component for displaying generated prompts
- Copy-to-clipboard functionality
- Responsive design

#### `/frontend/src/app/hooks/usePromptGeneration.ts`
- Custom hook for prompt generation API calls
- State management for prompt modal
- Error handling

#### `/frontend/src/app/services/promptService.ts`
- API client for prompt generation
- Request/response handling

## UI/UX Design

### Button Placement
- Position the "Generate Prompt" button next to the "Create Issue" button
- Same styling and responsive behavior as existing buttons
- Loading state during prompt generation

### Prompt Modal
- Overlay modal that appears above the issue content
- Clear visual hierarchy with:
  - Modal header with close button
  - Generated prompt in a scrollable code block
  - Copy button with success feedback
- Mobile-responsive design
- Keyboard navigation support (ESC to close)

### Visual States
- **Loading**: Button shows spinner and "Generating..." text
- **Success**: Modal opens with generated prompt
- **Error**: Error message display
- **Copied**: Temporary success feedback on copy button

## Error Handling

### Backend Errors
- Invalid request data (400)
- Server errors during generation (500)
- Rate limiting (429)

### Frontend Errors
- Network connectivity issues
- API timeout handling
- User-friendly error messages

## Security Considerations
- Input validation and sanitization
- Rate limiting on prompt generation
- No sensitive data exposure in prompts

## Performance Considerations
- Efficient prompt template rendering
- Minimal API payload size
- Client-side caching of generated prompts
- Debounced button clicks to prevent spam

## Testing Strategy

### Backend Tests
- Unit tests for prompt service
- API endpoint integration tests
- Error handling scenarios

### Frontend Tests
- Component unit tests
- Modal interaction tests
- Clipboard functionality tests
- Responsive design tests

## Implementation Checklist

### Backend Implementation
- [ ] Create `/backend/app/api/endpoints/prompt.py`
  - [ ] Define FastAPI router with `/generate` endpoint
  - [ ] Implement request validation using Pydantic models
  - [ ] Add comprehensive error handling and logging
  - [ ] Include proper HTTP status codes and responses

- [ ] Create `/backend/app/services/prompt_service.py`
  - [ ] Implement `generate_cursor_prompt()` function
  - [ ] Create prompt template with placeholders for issue data
  - [ ] Add logic to format code snippets with proper syntax highlighting hints
  - [ ] Handle optional fields (action_items, code_snippets, references)
  - [ ] Add prompt optimization for Cursor IDE compatibility

- [ ] Create `/backend/app/models/prompt.py`
  - [ ] Define `PromptGenerationRequest` Pydantic model
  - [ ] Define `PromptGenerationResponse` Pydantic model
  - [ ] Add validation rules for required fields
  - [ ] Include optional field handling

- [ ] Update `/backend/app/main.py`
  - [ ] Import and include the new prompt router
  - [ ] Add proper route registration

### Frontend Implementation
- [ ] Update `/frontend/src/app/components/display/IssueItem.tsx`
  - [ ] Add "Generate Prompt" button next to "Create Issue" button
  - [ ] Implement button click handler
  - [ ] Add loading state management
  - [ ] Include proper button styling and responsive behavior
  - [ ] Add accessibility attributes

- [ ] Create `/frontend/src/app/components/shared/PromptModal.tsx`
  - [ ] Implement modal overlay with backdrop
  - [ ] Create scrollable prompt display area
  - [ ] Add copy-to-clipboard functionality with success feedback
  - [ ] Implement close button and ESC key handling
  - [ ] Add responsive design for mobile devices
  - [ ] Include proper ARIA labels for accessibility

- [ ] Create `/frontend/src/app/hooks/usePromptGeneration.ts`
  - [ ] Implement custom hook for prompt generation state
  - [ ] Add API call handling with loading/error states
  - [ ] Include modal open/close state management
  - [ ] Add error handling and user feedback

- [ ] Create `/frontend/src/app/services/promptService.ts`
  - [ ] Implement `generatePrompt()` API client function
  - [ ] Add proper request/response type definitions
  - [ ] Include error handling and timeout configuration

- [ ] Update `/frontend/src/app/components/display/IssuesList.tsx`
  - [ ] Pass necessary props to IssueItem components
  - [ ] Handle any shared state if needed

### Styling and UI
- [ ] Add modal styles to support overlay and backdrop
- [ ] Ensure consistent button styling with existing components
- [ ] Implement responsive design for mobile devices
- [ ] Add loading animations and success feedback
- [ ] Test dark/light theme compatibility

### Testing and Quality Assurance
- [ ] Write unit tests for prompt service functions
- [ ] Add integration tests for the prompt generation API
- [ ] Test modal functionality across different browsers
- [ ] Verify clipboard functionality works on various devices
- [ ] Test responsive design on mobile and desktop
- [ ] Validate accessibility compliance
- [ ] Performance testing for prompt generation speed

### Documentation and Cleanup
- [ ] Update API documentation with new endpoint
- [ ] Add JSDoc comments to new React components
- [ ] Include error handling documentation
- [ ] Update README with new feature information

## File Relationships

### Backend Dependencies
- `prompt.py` → imports from `prompt_service.py` and `models/prompt.py`
- `prompt_service.py` → uses prompt templates and formatting utilities
- `main.py` → includes prompt router

### Frontend Dependencies
- `IssueItem.tsx` → uses `PromptModal.tsx` and `usePromptGeneration.ts`
- `PromptModal.tsx` → uses clipboard utilities and theme context
- `usePromptGeneration.ts` → calls `promptService.ts`
- `IssuesList.tsx` → passes props to `IssueItem.tsx`

This system design provides a comprehensive plan for implementing the cursor prompt generation feature with proper separation of concerns, error handling, and user experience considerations.
```
