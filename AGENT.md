# AGENT.md - Development Guidelines

## Architecture Philosophy

### Clean Architecture with DDD
- **Strict layer separation**: Domain logic is completely isolated from infrastructure concerns
- **Directory structure**:
  - `src/domain/` - Business entities, use cases, domain logic (no external dependencies)
  - `src/infra/` - All external concerns (database, web APIs, LLM integrations, file systems)
- **Dependency flow**: Always inward (infra → domain, never domain → infra)

### Dependency Injection
- **Simple dictionary-based injection** - No DI frameworks or libraries
- **Pattern**:
```python
def __init__(self, user_session: UserSession, injection: dict = {}):
    self.consolidar_entidade_externa = injection.get(
        "ConsolidarEntidadeExterna", ConsolidarEntidadeExterna
    )
```
- Allows passing custom implementations for testing while providing sensible defaults

## Code Style

### Naming Conventions
- Follow the language's standard conventions (PascalCase for classes, snake_case for functions in Python, etc.)
- Prefer clarity over brevity

### Type Hints
- Use type hints where helpful for clarity
- **Not strictly typed** - pragmatic approach, type hints as documentation
- No requirement for exhaustive typing or strict type checking

### Error Handling
- **Avoid try/catch blocks** - use them sparingly, only where absolutely necessary
- **Let exceptions bubble up** - handle errors at appropriate boundaries, not everywhere
- Trust the language's exception handling mechanisms

### Code Organization
- Keep it simple and straightforward
- No over-engineering or premature abstractions

## Testing Philosophy

### Behavior-Driven Approach
- **Write unit tests first** for new use cases
- **Test behavior, not implementation** - focus on inputs and outputs
- Test business flows end-to-end, not internal method calls

### Test Structure
- **AAA Pattern strictly**: Arrange-Act-Assert
- **File naming**: `src/tests/usecases/test_<use_case_name>.py`
- **Function naming**: `def test_<descriptive_name>():`
- **Clear docstrings** describing the business flow being tested

### Test Doubles
- **Prefer stubs over mocks** (95% of cases)
- Stubs return predetermined values
- Avoid mocks that verify method calls or interactions
- Keep tests focused on observable behavior

### Testing Tools
- Use boring, commodity libraries (e.g., pytest for Python)
- Keep testing setup as simple as possible
- No complex test frameworks or excessive tooling

## General Principles

1. **Simplicity first** - avoid unnecessary complexity
2. **Clear separation of concerns** - domain vs infrastructure
3. **Pragmatic typing** - helpful but not dogmatic
4. **Minimal error handling** - only where it adds value
5. **Behavior-focused testing** - test what matters to the business
6. **Convention over configuration** - follow language idioms

## What to Avoid

- ❌ Complex DI frameworks or containers
- ❌ Try/catch blocks everywhere
- ❌ Strict type checking enforcement
- ❌ Mocks that verify interactions
- ❌ Testing implementation details
- ❌ Over-abstraction and premature optimization
- ❌ Domain code depending on infrastructure

## Tech Stack Context

- **Backend**: Python with FastAPI
- **Frontend**: React
- **Database**: PostgreSQL (with clean repository pattern)
- **AI/LLM**: Integrations live in infra layer as adapters
- **Focus**: Brazilian fintech/BPO startup, reconciliation and classification systems