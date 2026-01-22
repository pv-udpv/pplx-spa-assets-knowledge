#!/usr/bin/env python3
"""
Perplexity SPA Spec Analyzer - CLI Tool

Commands:
    analyze-endpoint <path>     Find all usages of an endpoint
    feature-map                 Build feature dependency map
    openapi                     Generate OpenAPI v3 spec
    diff <old> <new>            Compare two specs

Usage:
    python spec_analyzer.py analyze-endpoint rest/finance/earnings
    python spec_analyzer.py feature-map --output features.json
    python spec_analyzer.py openapi --output api.json
    python spec_analyzer.py diff old.json new.json --output delta.json
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Any


def load_spec(path: str = "perplexity_spa_full_spec.json") -> Dict:
    """Load the main spec file."""
    with open(path) as f:
        return json.load(f)


def cmd_analyze_endpoint(spec: Dict, endpoint: str) -> None:
    """
    Analyze specific endpoint usage across modules.
    
    Args:
        spec: Full spec dict
        endpoint: Endpoint path (e.g., 'rest/finance/earnings')
    """
    print(f"\n📍 Analyzing endpoint: {endpoint}")
    print("=" * 60)
    
    # Check if endpoint exists
    if endpoint not in spec['endpoints']['rest']:
        print(f"❌ Endpoint '{endpoint}' not found in spec")
        return
    
    # Find in observed API calls
    calls = [c for c in spec['requests']['api_calls'] if c['path'] == endpoint]
    print(f"\n📊 Observed API calls: {len(calls)}")
    for call in calls:
        print(f"  • {call['method']} {call['path']} → {call['status']}")
    
    # Search in source codes (simplified)
    print(f"\n🔍 Searching in source codes...")
    endpoint_clean = endpoint.replace('rest/', '').replace('/', '_')
    found_modules = []
    
    for filename in spec['source_codes_meta'].keys():
        if endpoint_clean in filename.lower():
            found_modules.append(filename)
    
    if found_modules:
        print(f"\n📦 Found in modules: {len(found_modules)}")
        for mod in found_modules[:5]:  # Show first 5
            print(f"  • {mod}")
        if len(found_modules) > 5:
            print(f"  ... and {len(found_modules) - 5} more")
    else:
        print("⚠️  Not found in module filenames (may be in source code)")


def cmd_feature_map(spec: Dict, output: str) -> None:
    """
    Build feature dependency map.
    
    Maps features to modules and endpoints based on naming patterns.
    """
    print("\n🗺️ Building feature map...")
    
    feature_map = {}
    
    # Extract features from endpoints
    for category, endpoints in spec['endpoints']['rest_by_category'].items():
        if category not in feature_map:
            feature_map[category] = {
                'endpoints': [],
                'modules': []
            }
        feature_map[category]['endpoints'] = endpoints
    
    # Match modules to features
    for filename in spec['source_codes_meta'].keys():
        for category in feature_map.keys():
            if category.lower() in filename.lower():
                feature_map[category]['modules'].append(filename)
    
    # Save
    with open(output, 'w') as f:
        json.dump(feature_map, f, indent=2)
    
    print(f"✅ Feature map saved to: {output}")
    print(f"📊 Total features: {len(feature_map)}")


def cmd_openapi(spec: Dict, output: str) -> None:
    """
    Generate basic OpenAPI v3 spec.
    """
    print("\n📖 Generating OpenAPI v3 spec...")
    
    openapi = {
        "openapi": "3.0.0",
        "info": {
            "title": "Perplexity API",
            "description": "Reverse-engineered Perplexity.ai API specification",
            "version": "1.0.0"
        },
        "servers": [
            {"url": "https://www.perplexity.ai"}
        ],
        "paths": {}
    }
    
    # Add endpoints
    for endpoint in spec['endpoints']['rest']:
        path = f"/{endpoint}"
        method = "get"  # Default, should be inferred from calls
        
        # Check observed calls for method
        for call in spec['requests']['api_calls']:
            if call['path'] == endpoint:
                method = call['method'].lower()
                break
        
        if path not in openapi['paths']:
            openapi['paths'][path] = {}
        
        openapi['paths'][path][method] = {
            "summary": f"{method.upper()} {endpoint}",
            "responses": {
                "200": {
                    "description": "Successful response"
                }
            }
        }
    
    # Save
    with open(output, 'w') as f:
        json.dump(openapi, f, indent=2)
    
    print(f"✅ OpenAPI spec saved to: {output}")
    print(f"📊 Total paths: {len(openapi['paths'])}")


def cmd_diff(old_path: str, new_path: str, output: str) -> None:
    """
    Compare two specs and generate diff report.
    """
    print("\n🔍 Comparing specs...")
    
    with open(old_path) as f:
        old_spec = json.load(f)
    with open(new_path) as f:
        new_spec = json.load(f)
    
    # Compare endpoints
    old_endpoints = set(old_spec['endpoints']['rest'])
    new_endpoints = set(new_spec['endpoints']['rest'])
    
    added = new_endpoints - old_endpoints
    removed = old_endpoints - new_endpoints
    
    # Compare modules
    old_modules = set(old_spec['source_codes_meta'].keys())
    new_modules = set(new_spec['source_codes_meta'].keys())
    
    modules_added = new_modules - old_modules
    modules_removed = old_modules - new_modules
    
    diff_report = {
        "endpoints": {
            "added": list(added),
            "removed": list(removed),
            "total_old": len(old_endpoints),
            "total_new": len(new_endpoints)
        },
        "modules": {
            "added": list(modules_added),
            "removed": list(modules_removed),
            "total_old": len(old_modules),
            "total_new": len(new_modules)
        }
    }
    
    # Save
    with open(output, 'w') as f:
        json.dump(diff_report, f, indent=2)
    
    print(f"✅ Diff report saved to: {output}")
    print(f"\n📊 Endpoints:")
    print(f"  + Added: {len(added)}")
    print(f"  - Removed: {len(removed)}")
    print(f"\n📦 Modules:")
    print(f"  + Added: {len(modules_added)}")
    print(f"  - Removed: {len(modules_removed)}")


def main():
    parser = argparse.ArgumentParser(
        description="Perplexity SPA Spec Analyzer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  python spec_analyzer.py analyze-endpoint rest/finance/earnings
  python spec_analyzer.py feature-map --output features.json
  python spec_analyzer.py openapi --output api.json
  python spec_analyzer.py diff old.json new.json --output delta.json
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # analyze-endpoint
    p_analyze = subparsers.add_parser('analyze-endpoint', help='Analyze endpoint usage')
    p_analyze.add_argument('endpoint', help='Endpoint path (e.g., rest/finance/earnings)')
    p_analyze.add_argument('--spec', default='perplexity_spa_full_spec.json', help='Spec file path')
    
    # feature-map
    p_feature = subparsers.add_parser('feature-map', help='Build feature map')
    p_feature.add_argument('--spec', default='perplexity_spa_full_spec.json', help='Spec file path')
    p_feature.add_argument('--output', default='feature_map.json', help='Output file')
    
    # openapi
    p_openapi = subparsers.add_parser('openapi', help='Generate OpenAPI spec')
    p_openapi.add_argument('--spec', default='perplexity_spa_full_spec.json', help='Spec file path')
    p_openapi.add_argument('--output', default='perplexity_openapi.json', help='Output file')
    
    # diff
    p_diff = subparsers.add_parser('diff', help='Compare two specs')
    p_diff.add_argument('old', help='Old spec file')
    p_diff.add_argument('new', help='New spec file')
    p_diff.add_argument('--output', default='spec_diff.json', help='Output file')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        if args.command == 'analyze-endpoint':
            spec = load_spec(args.spec)
            cmd_analyze_endpoint(spec, args.endpoint)
        
        elif args.command == 'feature-map':
            spec = load_spec(args.spec)
            cmd_feature_map(spec, args.output)
        
        elif args.command == 'openapi':
            spec = load_spec(args.spec)
            cmd_openapi(spec, args.output)
        
        elif args.command == 'diff':
            cmd_diff(args.old, args.new, args.output)
        
        print("\n✅ Done!\n")
    
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()