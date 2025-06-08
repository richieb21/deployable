# Running the Backend

For development purposes, we recommend you install the development dependencies too for code formatting and environment variable injection. We also recommend you provide some of the template environment variables for LLM API keys.

First, we highly suggest using a virtual environment:

python -m venv .[venv name]

On mac:

source .venv/bin/activate

## Install Dev Dependencies

pip install -r requirements-dev.txt

## Run the server

cd backend
export $(grep -v '^#' .env | xargs) && uvicorn app.main:app --reload


uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --env-file .env --workers 4

