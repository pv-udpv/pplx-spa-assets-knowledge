#!/usr/bin/env python3
"""
GraphQL Query Extractor

Extracts and analyzes GraphQL queries from HAR files.
Detects GraphQL operations, extracts queries, mutations, and variables.

Usage:
    python scripts/graphql_extractor.py input.har.json -o queries/
    python scripts/graphql_extractor.py input.har.json -o queries.json --format json
"""

import argparse
import json
import os
import re
from typing import Any, Dict, List, Optional


class GraphQLExtractor:
    """Extract and analyze GraphQL queries from HAR files."""

    def __init__(self, har_file: str):
        """
        Initialize extractor with HAR file.

        Args:
            har_file: Path to HAR file
        """
        self.har_file = har_file
        self.har_data: Dict[str, Any] = {}
        self.queries: List[Dict[str, Any]] = []

    def load_har(self) -> None:
        """Load and parse HAR file."""
        try:
            with open(self.har_file, 'r', encoding='utf-8') as f:
                self.har_data = json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"HAR file not found: {self.har_file}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in HAR file: {e}")

    def extract_queries(self) -> List[Dict[str, Any]]:
        """
        Extract GraphQL queries from HAR entries.

        Returns:
            List of GraphQL operations with metadata
        """
        entries = self.har_data.get('log', {}).get('entries', [])

        for entry_idx, entry in enumerate(entries):
            request = entry.get('request', {})

            if not self._is_graphql_request(entry):
                continue

            # Extract query from request
            query, variables, operation_name = self._extract_query_from_request(request)

            if not query:
                continue

            # Extract response
            response = entry.get('response', {})
            response_data = self._extract_response_data(response)

            # Determine operation type
            operation_type = self._determine_operation_type(query)

            # Extract operation name from query if not in request
            if not operation_name:
                operation_name = self._extract_operation_name(query)

            self.queries.append({
                'operation_name': operation_name or f'operation_{entry_idx}',
                'operation_type': operation_type,
                'query': query,
                'variables': variables,
                'url': request.get('url', ''),
                'response': response_data,
                'timestamp': entry.get('startedDateTime', '')
            })

        return self.queries

    def _is_graphql_request(self, entry: Dict[str, Any]) -> bool:
        """
        Check if HAR entry is a GraphQL request.

        Args:
            entry: HAR entry

        Returns:
            True if entry is GraphQL request
        """
        request = entry.get('request', {})

        # Check URL path
        url = request.get('url', '')
        if '/graphql' in url.lower() or '/graph' in url.lower():
            return True

        # Check Content-Type header
        headers = request.get('headers', [])
        for header in headers:
            if header.get('name', '').lower() == 'content-type':
                content_type = header.get('value', '').lower()
                if 'application/json' in content_type or 'application/graphql' in content_type:
                    # Check if body contains GraphQL query
                    post_data = request.get('postData', {})
                    text = post_data.get('text', '')
                    if 'query' in text.lower() or 'mutation' in text.lower():
                        return True

        return False

    def _extract_query_from_request(self, request: Dict[str, Any]) -> tuple[Optional[str], Optional[Dict], Optional[str]]:
        """
        Extract GraphQL query, variables, and operation name from request.

        Args:
            request: HAR request object

        Returns:
            Tuple of (query, variables, operation_name)
        """
        post_data = request.get('postData', {})
        text = post_data.get('text', '')

        if not text:
            return None, None, None

        try:
            data = json.loads(text)

            query = data.get('query')
            variables = data.get('variables')
            operation_name = data.get('operationName')

            return query, variables, operation_name

        except json.JSONDecodeError:
            # Maybe raw GraphQL query
            if text.strip().startswith(('query', 'mutation', 'subscription')):
                return text.strip(), None, None

        return None, None, None

    def _extract_operation_name(self, query: str) -> Optional[str]:
        """
        Extract operation name from GraphQL query.

        Args:
            query: GraphQL query string

        Returns:
            Operation name or None
        """
        # Match patterns like: query GetUser { ... } or mutation CreatePost { ... }
        match = re.search(r'(?:query|mutation|subscription)\s+(\w+)', query)
        if match:
            return match.group(1)

        return None

    def _determine_operation_type(self, query: str) -> str:
        """
        Determine GraphQL operation type.

        Args:
            query: GraphQL query string

        Returns:
            Operation type: 'query', 'mutation', or 'subscription'
        """
        query_lower = query.lower().strip()

        if query_lower.startswith('mutation'):
            return 'mutation'
        elif query_lower.startswith('subscription'):
            return 'subscription'
        else:
            return 'query'

    def _extract_response_data(self, response: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extract GraphQL response data.

        Args:
            response: HAR response object

        Returns:
            Response data or None
        """
        content = response.get('content', {})
        text = content.get('text', '')

        if not text:
            return None

        try:
            data = json.loads(text)
            return data
        except json.JSONDecodeError:
            return None

    def group_by_operation(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Group queries by operation name.

        Returns:
            Dictionary mapping operation names to queries
        """
        grouped: Dict[str, List[Dict[str, Any]]] = {}

        for query in self.queries:
            operation_name = query['operation_name']
            if operation_name not in grouped:
                grouped[operation_name] = []
            grouped[operation_name].append(query)

        return grouped

    def extract(self) -> List[Dict[str, Any]]:
        """
        Extract GraphQL queries (main method).

        Returns:
            List of GraphQL operations
        """
        self.load_har()
        return self.extract_queries()


def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Extract GraphQL queries from HAR files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/graphql_extractor.py input.har.json -o queries/
  python scripts/graphql_extractor.py input.har.json -o queries.json --format json
        """
    )
    parser.add_argument('input', help='Input HAR file path')
    parser.add_argument('-o', '--output', required=True, help='Output directory or file path')
    parser.add_argument(
        '-f', '--format',
        choices=['dir', 'json'],
        default='dir',
        help='Output format: dir (separate files) or json (single file)'
    )
    parser.add_argument(
        '--pretty',
        action='store_true',
        help='Pretty print JSON output'
    )
    parser.add_argument(
        '--group',
        action='store_true',
        help='Group queries by operation name'
    )

    args = parser.parse_args()

    try:
        # Extract GraphQL queries
        extractor = GraphQLExtractor(args.input)
        queries = extractor.extract()

        if not queries:
            print("⚠️  No GraphQL queries found in HAR file")
            return

        # Write output
        if args.format == 'dir':
            # Create output directory
            os.makedirs(args.output, exist_ok=True)

            if args.group:
                # Group by operation and save
                grouped = extractor.group_by_operation()
                for operation_name, ops in grouped.items():
                    file_path = os.path.join(args.output, f"{operation_name}.json")
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(ops, f, indent=2 if args.pretty else None)
                    print(f"   Saved {len(ops)} operations to {file_path}")
            else:
                # Save each query separately
                for idx, query in enumerate(queries):
                    operation_name = query['operation_name']
                    file_path = os.path.join(args.output, f"{operation_name}_{idx}.json")
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(query, f, indent=2 if args.pretty else None)

        else:
            # Save as single JSON file
            output_data = queries
            if args.group:
                output_data = extractor.group_by_operation()

            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2 if args.pretty else None)

        print(f"✅ Successfully extracted GraphQL queries")
        print(f"   Input: {args.input}")
        print(f"   Output: {args.output}")
        print(f"   Total queries: {len(queries)}")
        print(f"   Unique operations: {len(set(q['operation_name'] for q in queries))}")

        # Print operation type breakdown
        query_count = sum(1 for q in queries if q['operation_type'] == 'query')
        mutation_count = sum(1 for q in queries if q['operation_type'] == 'mutation')
        subscription_count = sum(1 for q in queries if q['operation_type'] == 'subscription')

        print(f"   Queries: {query_count}")
        print(f"   Mutations: {mutation_count}")
        print(f"   Subscriptions: {subscription_count}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import sys
        sys.exit(1)


if __name__ == '__main__':
    main()
