#!/usr/bin/env python3
"""
WebSocket Schema Extractor

Extracts JSON schemas from WebSocket message logs and generates AsyncAPI specifications.
Supports .ws.jsonl files (newline-delimited JSON).

Usage:
    python scripts/ws_schema_extractor.py input.ws.jsonl -o asyncapi.yaml
    python scripts/ws_schema_extractor.py input.ws.jsonl -o asyncapi.json --format json
"""

import argparse
import json
from typing import Any, Dict, List
import yaml

try:
    from genson import SchemaBuilder
except ImportError:
    print("❌ Error: genson library not found")
    print("Please install: pip install genson")
    import sys
    sys.exit(1)


class WebSocketSchemaExtractor:
    """Extract JSON schemas from WebSocket logs and generate AsyncAPI specs."""

    def __init__(self, ws_log_file: str):
        """
        Initialize extractor with WebSocket log file.

        Args:
            ws_log_file: Path to .ws.jsonl file
        """
        self.ws_log_file = ws_log_file
        self.messages: List[Dict[str, Any]] = []
        self.send_schemas: Dict[str, SchemaBuilder] = {}
        self.receive_schemas: Dict[str, SchemaBuilder] = {}
        self.urls: List[str] = []

    def load_messages(self) -> None:
        """Load and parse WebSocket messages from JSONL file."""
        try:
            with open(self.ws_log_file, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        message = json.loads(line)
                        self.messages.append(message)
                        
                        # Track unique URLs
                        url = message.get('url', 'unknown')
                        if url not in self.urls:
                            self.urls.append(url)
                    except json.JSONDecodeError as e:
                        print(f"⚠️  Warning: Invalid JSON on line {line_num}: {e}")
        except FileNotFoundError:
            raise FileNotFoundError(f"WebSocket log file not found: {self.ws_log_file}")

    def extract_schemas(self) -> Dict[str, Any]:
        """
        Extract schemas from WebSocket messages.

        Returns:
            Dictionary containing send and receive schemas
        """
        for message in self.messages:
            direction = message.get('direction', 'unknown')
            data = message.get('data')

            if not data or not isinstance(data, (dict, list)):
                continue

            # Infer message type
            message_type = self._infer_message_type(data)

            # Build schema for message type and direction
            if direction == 'send':
                if message_type not in self.send_schemas:
                    self.send_schemas[message_type] = SchemaBuilder()
                self.send_schemas[message_type].add_object(data)
            elif direction == 'receive':
                if message_type not in self.receive_schemas:
                    self.receive_schemas[message_type] = SchemaBuilder()
                self.receive_schemas[message_type].add_object(data)

        # Convert SchemaBuilders to schemas
        result = {
            'send': {
                msg_type: builder.to_schema()
                for msg_type, builder in self.send_schemas.items()
            },
            'receive': {
                msg_type: builder.to_schema()
                for msg_type, builder in self.receive_schemas.items()
            }
        }

        return result

    def _infer_message_type(self, data: Any) -> str:
        """
        Infer message type from data structure.

        Args:
            data: Message data

        Returns:
            Message type string
        """
        if isinstance(data, dict):
            # Check for common type indicators
            if 'type' in data:
                return str(data['type'])
            elif 'event' in data:
                return str(data['event'])
            elif 'action' in data:
                return str(data['action'])
            elif 'method' in data:
                return str(data['method'])
            else:
                return 'message'
        elif isinstance(data, list):
            return 'array_message'
        else:
            return 'unknown'

    def generate_asyncapi(self) -> Dict[str, Any]:
        """
        Generate AsyncAPI 2.6.0 specification.

        Returns:
            AsyncAPI specification dictionary
        """
        schemas = self.extract_schemas()

        asyncapi_spec: Dict[str, Any] = {
            'asyncapi': '2.6.0',
            'info': {
                'title': 'WebSocket API',
                'version': '1.0.0',
                'description': 'WebSocket API specification extracted from message logs'
            },
            'servers': {},
            'channels': {}
        }

        # Add servers
        for idx, url in enumerate(self.urls[:5], 1):  # Limit to 5 servers
            asyncapi_spec['servers'][f'server{idx}'] = {
                'url': url,
                'protocol': 'ws' if url.startswith('ws://') else 'wss',
                'description': f'WebSocket server {idx}'
            }

        # Add channels for send messages
        for message_type, schema in schemas['send'].items():
            channel_name = f'/send/{message_type}'
            asyncapi_spec['channels'][channel_name] = {
                'description': f'Channel for sending {message_type} messages',
                'publish': {
                    'summary': f'Send {message_type} message',
                    'message': {
                        'name': message_type,
                        'payload': schema
                    }
                }
            }

        # Add channels for receive messages
        for message_type, schema in schemas['receive'].items():
            channel_name = f'/receive/{message_type}'
            asyncapi_spec['channels'][channel_name] = {
                'description': f'Channel for receiving {message_type} messages',
                'subscribe': {
                    'summary': f'Receive {message_type} message',
                    'message': {
                        'name': message_type,
                        'payload': schema
                    }
                }
            }

        return asyncapi_spec

    def extract(self) -> Dict[str, Any]:
        """
        Extract schemas and generate AsyncAPI (main method).

        Returns:
            AsyncAPI specification
        """
        self.load_messages()
        return self.generate_asyncapi()


def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Extract JSON schemas from WebSocket logs and generate AsyncAPI specs',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/ws_schema_extractor.py input.ws.jsonl -o asyncapi.yaml
  python scripts/ws_schema_extractor.py input.ws.jsonl -o asyncapi.json --format json
        """
    )
    parser.add_argument('input', help='Input WebSocket log file (.ws.jsonl)')
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
        # Extract schemas and generate AsyncAPI
        extractor = WebSocketSchemaExtractor(args.input)
        asyncapi_spec = extractor.extract()

        # Write output
        with open(args.output, 'w', encoding='utf-8') as f:
            if args.format == 'yaml':
                yaml.dump(asyncapi_spec, f, default_flow_style=False, sort_keys=False)
            else:
                if args.pretty:
                    json.dump(asyncapi_spec, f, indent=2)
                else:
                    json.dump(asyncapi_spec, f)

        print(f"✅ Successfully extracted WebSocket schemas")
        print(f"   Input: {args.input}")
        print(f"   Output: {args.output}")
        print(f"   Messages processed: {len(extractor.messages)}")
        print(f"   Send message types: {len(extractor.send_schemas)}")
        print(f"   Receive message types: {len(extractor.receive_schemas)}")
        print(f"   WebSocket URLs: {len(extractor.urls)}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import sys
        sys.exit(1)


if __name__ == '__main__':
    main()
