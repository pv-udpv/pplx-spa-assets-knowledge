#!/usr/bin/env python3
"""
HAR to OpenAPI Converter

Converts HAR (HTTP Archive) files to OpenAPI 3.0 specifications.
Extracts endpoints, normalizes paths, detects parameters, and generates schemas.

Usage:
    python scripts/har_to_openapi.py input.har.json -o output.yaml
    python scripts/har_to_openapi.py input.har.json -o output.json --format json
"""

import argparse
import json
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse, parse_qs
import yaml


class HARToOpenAPIConverter:
    """Convert HAR files to OpenAPI 3.0 specifications."""

    def __init__(self, har_file: str):
        """
        Initialize converter with HAR file.

        Args:
            har_file: Path to HAR file
        """
        self.har_file = har_file
        self.har_data: Dict[str, Any] = {}
        self.endpoints: Dict[str, Dict[str, Any]] = {}
        self.servers: List[str] = []

    def load_har(self) -> None:
        """Load and parse HAR file."""
        try:
            with open(self.har_file, 'r', encoding='utf-8') as f:
                self.har_data = json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"HAR file not found: {self.har_file}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in HAR file: {e}")

    def extract_endpoints(self) -> None:
        """Extract all HTTP endpoints from HAR entries."""
        entries = self.har_data.get('log', {}).get('entries', [])

        for entry in entries:
            request = entry.get('request', {})
            response = entry.get('response', {})

            method = request.get('method', 'GET').upper()
            url = request.get('url', '')

            if not url:
                continue

            # Parse URL
            parsed_url = urlparse(url)
            base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"

            # Track servers
            if base_url not in self.servers:
                self.servers.append(base_url)

            # Extract path pattern
            path = parsed_url.path or '/'
            path_pattern, path_params = self._extract_path_pattern(path)

            # Create endpoint key
            endpoint_key = f"{method}:{path_pattern}"

            # Initialize endpoint if not exists
            if endpoint_key not in self.endpoints:
                self.endpoints[endpoint_key] = {
                    'method': method,
                    'path': path_pattern,
                    'path_params': path_params,
                    'query_params': {},
                    'headers': {},
                    'request_bodies': [],
                    'responses': {},
                }

            # Extract query parameters
            query_params = parse_qs(parsed_url.query)
            for param, values in query_params.items():
                if param not in self.endpoints[endpoint_key]['query_params']:
                    self.endpoints[endpoint_key]['query_params'][param] = {
                        'type': 'string',
                        'examples': []
                    }
                if values:
                    self.endpoints[endpoint_key]['query_params'][param]['examples'].extend(values[:3])

            # Extract request headers
            for header in request.get('headers', []):
                header_name = header.get('name', '')
                if header_name.lower() not in ['cookie', 'authorization', 'user-agent']:
                    continue
                if header_name not in self.endpoints[endpoint_key]['headers']:
                    self.endpoints[endpoint_key]['headers'][header_name] = {'type': 'string'}

            # Extract request body
            request_body = self._extract_body(request)
            if request_body:
                self.endpoints[endpoint_key]['request_bodies'].append(request_body)

            # Extract response
            status_code = str(response.get('status', 200))
            response_body = self._extract_response_body(response)
            if status_code not in self.endpoints[endpoint_key]['responses']:
                self.endpoints[endpoint_key]['responses'][status_code] = {
                    'description': response.get('statusText', 'OK'),
                    'bodies': []
                }
            if response_body:
                self.endpoints[endpoint_key]['responses'][status_code]['bodies'].append(response_body)

    def _extract_path_pattern(self, path: str) -> Tuple[str, List[Dict[str, str]]]:
        """
        Extract path pattern by normalizing dynamic segments.

        Args:
            path: URL path

        Returns:
            Tuple of (path_pattern, path_parameters)

        Example:
            /api/user/123 -> (/api/user/{id}, [{'name': 'id', 'type': 'integer'}])
        """
        segments = path.split('/')
        pattern_segments = []
        path_params = []

        for segment in segments:
            if not segment:
                pattern_segments.append(segment)
                continue

            # Check if segment is numeric ID
            if segment.isdigit():
                param_name = 'id'
                param_type = 'integer'
                # If multiple IDs, differentiate them
                if any(p['name'] == param_name for p in path_params):
                    param_name = f"id{len([p for p in path_params if p['name'].startswith('id')]) + 1}"
                path_params.append({'name': param_name, 'type': param_type})
                pattern_segments.append(f"{{{param_name}}}")

            # Check if segment is UUID
            elif self._is_uuid(segment):
                param_name = 'uuid'
                if any(p['name'] == param_name for p in path_params):
                    param_name = f"uuid{len([p for p in path_params if p['name'].startswith('uuid')]) + 1}"
                path_params.append({'name': param_name, 'type': 'string', 'format': 'uuid'})
                pattern_segments.append(f"{{{param_name}}}")

            # Check if segment looks like a hash (long alphanumeric)
            elif len(segment) > 20 and re.match(r'^[a-zA-Z0-9_-]+$', segment):
                param_name = 'hash'
                if any(p['name'] == param_name for p in path_params):
                    param_name = f"hash{len([p for p in path_params if p['name'].startswith('hash')]) + 1}"
                path_params.append({'name': param_name, 'type': 'string'})
                pattern_segments.append(f"{{{param_name}}}")

            else:
                pattern_segments.append(segment)

        return '/'.join(pattern_segments), path_params

    def _is_uuid(self, value: str) -> bool:
        """
        Check if value is a UUID.

        Args:
            value: String to check

        Returns:
            True if value matches UUID pattern
        """
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        return bool(re.match(uuid_pattern, value, re.IGNORECASE))

    def _extract_body(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extract request body schema.

        Args:
            request: HAR request object

        Returns:
            Body schema or None
        """
        post_data = request.get('postData', {})
        mime_type = post_data.get('mimeType', '')
        text = post_data.get('text', '')

        if not text:
            return None

        # Handle JSON
        if 'application/json' in mime_type:
            try:
                data = json.loads(text)
                return {
                    'type': 'application/json',
                    'schema': self._infer_schema(data)
                }
            except json.JSONDecodeError:
                return None

        # Handle form data
        if 'application/x-www-form-urlencoded' in mime_type:
            return {
                'type': 'application/x-www-form-urlencoded',
                'schema': {'type': 'object', 'properties': {}}
            }

        # Binary or unknown
        return {
            'type': mime_type or 'application/octet-stream',
            'schema': {'type': 'string', 'format': 'binary'}
        }

    def _extract_response_body(self, response: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extract response body schema.

        Args:
            response: HAR response object

        Returns:
            Body schema or None
        """
        content = response.get('content', {})
        mime_type = content.get('mimeType', '')
        text = content.get('text', '')

        if not text:
            return None

        # Handle JSON
        if 'application/json' in mime_type:
            try:
                data = json.loads(text)
                return {
                    'type': 'application/json',
                    'schema': self._infer_schema(data)
                }
            except json.JSONDecodeError:
                return None

        # Handle text
        if 'text/' in mime_type:
            return {
                'type': mime_type,
                'schema': {'type': 'string'}
            }

        # Binary or unknown
        return {
            'type': mime_type or 'application/octet-stream',
            'schema': {'type': 'string', 'format': 'binary'}
        }

    def _infer_schema(self, data: Any) -> Dict[str, Any]:
        """
        Infer JSON schema from data.

        Args:
            data: JSON data

        Returns:
            JSON schema
        """
        if data is None:
            return {'type': 'null'}
        elif isinstance(data, bool):
            return {'type': 'boolean'}
        elif isinstance(data, int):
            return {'type': 'integer'}
        elif isinstance(data, float):
            return {'type': 'number'}
        elif isinstance(data, str):
            return {'type': 'string'}
        elif isinstance(data, list):
            if not data:
                return {'type': 'array', 'items': {}}
            # Use first item as schema
            return {'type': 'array', 'items': self._infer_schema(data[0])}
        elif isinstance(data, dict):
            properties = {}
            for key, value in data.items():
                properties[key] = self._infer_schema(value)
            return {'type': 'object', 'properties': properties}
        else:
            return {'type': 'string'}

    def generate_openapi(self) -> Dict[str, Any]:
        """
        Generate OpenAPI 3.0 specification.

        Returns:
            OpenAPI specification dictionary
        """
        openapi_spec: Dict[str, Any] = {
            'openapi': '3.0.0',
            'info': {
                'title': 'API extracted from HAR',
                'version': '1.0.0',
                'description': 'API specification generated from HAR file'
            },
            'servers': [{'url': server} for server in self.servers[:5]],  # Limit to 5 servers
            'paths': {}
        }

        for endpoint_key, endpoint in self.endpoints.items():
            path = endpoint['path']
            method = endpoint['method'].lower()

            if path not in openapi_spec['paths']:
                openapi_spec['paths'][path] = {}

            operation: Dict[str, Any] = {
                'summary': f"{method.upper()} {path}",
                'responses': {}
            }

            # Add path parameters
            if endpoint['path_params']:
                operation['parameters'] = []
                for param in endpoint['path_params']:
                    param_schema = {'type': param['type']}
                    if 'format' in param:
                        param_schema['format'] = param['format']
                    operation['parameters'].append({
                        'name': param['name'],
                        'in': 'path',
                        'required': True,
                        'schema': param_schema
                    })

            # Add query parameters
            if endpoint['query_params']:
                if 'parameters' not in operation:
                    operation['parameters'] = []
                for param_name, param_info in endpoint['query_params'].items():
                    operation['parameters'].append({
                        'name': param_name,
                        'in': 'query',
                        'required': False,
                        'schema': {'type': param_info['type']},
                        'examples': param_info['examples'][:3] if param_info['examples'] else []
                    })

            # Add request body
            if endpoint['request_bodies']:
                # Merge schemas from multiple requests
                body = endpoint['request_bodies'][0]
                operation['requestBody'] = {
                    'content': {
                        body['type']: {
                            'schema': body['schema']
                        }
                    }
                }

            # Add responses
            for status_code, response_info in endpoint['responses'].items():
                response_obj: Dict[str, Any] = {
                    'description': response_info['description']
                }
                
                if response_info['bodies']:
                    body = response_info['bodies'][0]
                    response_obj['content'] = {
                        body['type']: {
                            'schema': body['schema']
                        }
                    }

                operation['responses'][status_code] = response_obj

            openapi_spec['paths'][path][method] = operation

        return openapi_spec

    def convert(self) -> Dict[str, Any]:
        """
        Convert HAR to OpenAPI (main method).

        Returns:
            OpenAPI specification
        """
        self.load_har()
        self.extract_endpoints()
        return self.generate_openapi()


def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Convert HAR files to OpenAPI 3.0 specifications',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/har_to_openapi.py input.har.json -o output.yaml
  python scripts/har_to_openapi.py input.har.json -o output.json --format json
        """
    )
    parser.add_argument('input', help='Input HAR file path')
    parser.add_argument('-o', '--output', required=True, help='Output file path')
    parser.add_argument(
        '-f', '--format',
        choices=['yaml', 'json'],
        default='yaml',
        help='Output format (default: yaml)'
    )
    parser.add_argument(
        '--pretty',
        action='store_true',
        help='Pretty print JSON output'
    )

    args = parser.parse_args()

    try:
        # Convert HAR to OpenAPI
        converter = HARToOpenAPIConverter(args.input)
        openapi_spec = converter.convert()

        # Write output
        with open(args.output, 'w', encoding='utf-8') as f:
            if args.format == 'yaml':
                yaml.dump(openapi_spec, f, default_flow_style=False, sort_keys=False)
            else:
                if args.pretty:
                    json.dump(openapi_spec, f, indent=2)
                else:
                    json.dump(openapi_spec, f)

        print(f"✅ Successfully converted HAR to OpenAPI")
        print(f"   Input: {args.input}")
        print(f"   Output: {args.output}")
        print(f"   Endpoints: {len(converter.endpoints)}")
        print(f"   Servers: {len(converter.servers)}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import sys
        sys.exit(1)


if __name__ == '__main__':
    main()
