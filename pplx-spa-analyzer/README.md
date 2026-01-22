# Perplexity SPA Analyzer

Type-safe HAR analysis with SQLModel + DuckDB hybrid architecture.

## Features

- ✅ **Type-safe models** with SQLModel/Pydantic
- ✅ **Fast analytics** with DuckDB columnar storage
- ✅ **CLI tool** for HAR import and analysis
- ✅ **Parquet export** for data pipelines
- ✅ **Zero runtime dependencies** (embedded DuckDB)

## Installation

```bash
cd pplx-spa-analyzer

# Create virtual environment
uv venv
source .venv/bin/activate

# Install package
uv pip install -e .
```

## Quick Start

```bash
# Import HAR file
pplx import-har ../data/21012026_2003.www.perplexity.ai.har.json

# View statistics
pplx stats

# List API endpoints
pplx list-endpoints --category user

# Find slow requests
pplx slow-requests --threshold 500

# Export to Parquet
pplx export-parquet --output ./exports
```

## Python API

```python
from pplx_analyzer.repositories.har_repo import HARRepository

with HARRepository() as repo:
    # Get API calls
    api_calls = repo.find_api_calls(limit=50)
    
    # Analytics (pandas DataFrame)
    slow_requests = repo.analytics_slow_requests(threshold_ms=500)
    
    # Stats
    stats = repo.get_stats()
    print(f"Total entries: {stats['total_entries']}")
```

## Architecture

```
┌─────────────────────────────────────────┐
│     SQLModel Models (Type Safety)       │
│  • HAREntry, JSModule, APIEndpoint      │
├─────────────────────────────────────────┤
│      Repository Layer (Adapter)         │
│  • Type-safe queries                    │
├─────────────────────────────────────────┤
│       DuckDB Storage (Analytics)        │
│  • Columnar tables                      │
└─────────────────────────────────────────┘
```

## License

MIT
