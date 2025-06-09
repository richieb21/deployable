"""
Prompt Service for generating Cursor IDE-compatible prompts.
See system-design/cursor-prompt-generation.md for full design details.
"""

import re
from datetime import datetime
from typing import Optional, List
from app.models.schemas import PromptGenerationRequest, CodeSnippets


def _get_language_from_file_path(file_path: str) -> str:
    """Extract language hint from file extension for syntax highlighting."""
    extension_map = {
        '.py': 'python',
        '.js': 'javascript',
        '.jsx': 'jsx',
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.cs': 'csharp',
        '.php': 'php',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust',
        '.sh': 'bash',
        '.yml': 'yaml',
        '.yaml': 'yaml',
        '.json': 'json',
        '.xml': 'xml',
        '.md': 'markdown',
        '.sql': 'sql',
        '.r': 'r',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.dart': 'dart',
        '.vue': 'vue',
    }
    
    # Extract extension from file path
    extension = '.' + file_path.split('.')[-1].lower() if '.' in file_path else ''
    return extension_map.get(extension, 'text')


def _format_action_items(action_items: Optional[List[str]]) -> str:
    """Format action items into a bulleted list."""
    if not action_items:
        return ""
    
    formatted_items = "\n".join(f"- {item}" for item in action_items)
    return f"""
**Action Items**:
{formatted_items}
"""


def _format_code_snippets(code_snippets: Optional[CodeSnippets], file_path: str) -> str:
    """Format code snippets with proper syntax highlighting."""
    if not code_snippets or (not code_snippets.before and not code_snippets.after):
        return ""
    
    language = _get_language_from_file_path(file_path)
    result = ""
    
    if code_snippets.before:
        result += f"""
**Current Code**:
```{language}
{code_snippets.before.strip()}
```
"""
    
    if code_snippets.after:
        result += f"""
**Expected Code**:
```{language}
{code_snippets.after.strip()}
```
"""
    
    return result


def _format_references(references: Optional[List[str]]) -> str:
    """Format references into a bulleted list."""
    if not references:
        return ""
    
    formatted_refs = "\n".join(f"- {ref}" for ref in references)
    return f"""
**References**:
{formatted_refs}
"""


def generate_cursor_prompt(request: PromptGenerationRequest) -> str:
    """
    Generate a Cursor IDE-compatible prompt from issue data.
    
    Args:
        request: The prompt generation request containing issue details
        
    Returns:
        str: A formatted prompt ready for use in Cursor IDE
    """
    
    # Build the prompt using the template structure
    prompt_parts = [
        "Fix the following code quality issue:",
        "",
        f"**Issue**: {request.title}",
        f"**File**: {request.file_path}",
        f"**Severity**: {request.severity}",
        f"**Category**: {request.category}",
        "",
        f"**Description**:",
        request.description,
    ]
    
    # Add optional sections
    action_items_section = _format_action_items(request.action_items)
    if action_items_section:
        prompt_parts.append(action_items_section)
    
    code_snippets_section = _format_code_snippets(request.code_snippets, request.file_path)
    if code_snippets_section:
        prompt_parts.append(code_snippets_section)
    
    references_section = _format_references(request.references)
    if references_section:
        prompt_parts.append(references_section)
    
    # Add closing instructions
    prompt_parts.extend([
        "",
        "Please analyze the code and implement the necessary changes to resolve this issue. Make sure to:",
        f"1. Follow best practices for {request.category.lower()}",
        "2. Maintain code readability and consistency",
        "3. Add appropriate comments where necessary",
        "4. Test the changes thoroughly"
    ])
    
    return "\n".join(prompt_parts)


def get_current_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.utcnow().isoformat() + "Z" 