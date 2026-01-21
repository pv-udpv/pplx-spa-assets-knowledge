/**
 * AST-based TypeScript parser using ts-morph
 */

import {
  Project,
  Type,
  Node,
  SourceFile,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
} from 'ts-morph';
import type {
  ExtractedType,
  TypeProperty,
  TypeMethod,
  MethodParameter,
  APIEndpoint,
  Symbol as ASTSymbol,
} from '../types/index.js';

export class TypeScriptASTParser {
  private project: Project;

  constructor(tsconfigPath?: string) {
    this.project = new Project({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        skipLibCheck: true,
        esModuleInterop: true,
      },
      tsConfigFilePath: tsconfigPath,
    });
  }

  /**
   * Parse TypeScript file and extract types
   */
  parseFile(filePath: string): {
    types: ExtractedType[];
    symbols: ASTSymbol[];
    endpoints: APIEndpoint[];
  } {
    const sourceFile = this.project.addSourceFileAtPath(filePath);
    return this.extractFromSourceFile(sourceFile);
  }

  /**
   * Parse content string directly (useful for fetched assets)
   */
  parseContent(
    content: string,
    filePath = 'temp.ts'
  ): {
    types: ExtractedType[];
    symbols: ASTSymbol[];
    endpoints: APIEndpoint[];
  } {
    try {
      const sourceFile = this.project.createSourceFile(filePath, content, { overwrite: true });
      return this.extractFromSourceFile(sourceFile);
    } catch (error) {
      console.error(`Failed to parse ${filePath}:`, error);
      return { types: [], symbols: [], endpoints: [] };
    }
  }

  private extractFromSourceFile(
    sourceFile: SourceFile
  ): {
    types: ExtractedType[];
    symbols: ASTSymbol[];
    endpoints: APIEndpoint[];
  } {
    const types: ExtractedType[] = [];
    const symbols: ASTSymbol[] = [];
    const endpoints: APIEndpoint[] = [];

    // Interfaces
    for (const iface of sourceFile.getInterfaces()) {
      types.push(this.extractInterface(iface));
      symbols.push(this.extractSymbol(iface));
    }

    // Type aliases
    for (const alias of sourceFile.getTypeAliases()) {
      types.push(this.extractTypeAlias(alias));
      symbols.push(this.extractSymbol(alias));
    }

    // Classes
    for (const cls of sourceFile.getClasses()) {
      types.push(this.extractClass(cls));
      symbols.push(this.extractSymbol(cls));
    }

    // Enums
    for (const enm of sourceFile.getEnums()) {
      types.push(this.extractEnum(enm));
      symbols.push(this.extractSymbol(enm));
    }

    // Functions
    for (const fn of sourceFile.getFunctions()) {
      symbols.push(this.extractSymbol(fn));
      const endpoint = this.extractEndpointFromFunction(fn, sourceFile.getFilePath());
      if (endpoint) endpoints.push(endpoint);
    }

    return { types, symbols, endpoints };
  }

  private extractInterface(iface: InterfaceDeclaration): ExtractedType {
    return {
      name: iface.getName(),
      kind: 'interface',
      properties: iface.getProperties().map(prop => this.extractProperty(prop)),
      extends: iface.getExtends().map(ext => ext.getText()),
    };
  }

  private extractTypeAlias(alias: TypeAliasDeclaration): ExtractedType {
    return {
      name: alias.getName(),
      kind: 'type',
      properties: this.extractPropertiesFromType(alias.getType()),
    };
  }

  private extractClass(cls: ClassDeclaration): ExtractedType {
    const type: ExtractedType = {
      name: cls.getName() || 'UnnamedClass',
      kind: 'class',
      properties: [],
      methods: [],
    };

    // Properties
    for (const prop of cls.getProperties()) {
      type.properties?.push(this.extractProperty(prop));
    }

    // Methods
    for (const method of cls.getMethods()) {
      type.methods?.push(this.extractMethod(method));
    }

    // Base classes
    const baseClass = cls.getExtends();
    if (baseClass) {
      type.extends = [baseClass.getText()];
    }

    return type;
  }

  private extractEnum(enm: EnumDeclaration): ExtractedType {
    return {
      name: enm.getName(),
      kind: 'enum',
      properties: enm.getMembers().map(member => {
        const value = member.getValue();
        const valueType = value === undefined ? 'string' : typeof value;
        return {
          name: member.getName(),
          type: valueType,
          optional: false,
          readonly: false,
        };
      }),
    };
  }

  private extractProperty(prop: PropertyDeclaration): TypeProperty {
    return {
      name: prop.getName(),
      type: prop.getType().getText(),
      optional: prop.isOptional(),
      readonly: prop.isReadonly(),
      description: this.getJSDocComment(prop),
    };
  }

  private extractMethod(method: MethodDeclaration): TypeMethod {
    return {
      name: method.getName(),
      parameters: method.getParameters().map(param => ({
        name: param.getName(),
        type: param.getType().getText(),
        optional: param.isOptional(),
        defaultValue: param.getInitializer()?.getText(),
      })),
      returnType: method.getReturnType().getText(),
      async: method.isAsync(),
    };
  }

  private extractPropertiesFromType(type: Type): TypeProperty[] {
    const properties: TypeProperty[] = [];
    const props = type.getProperties();

    for (const prop of props) {
      const declarations = prop.getDeclarations();
      const declaration = declarations[0];

      if (declaration && Node.isPropertySignature(declaration)) {
        properties.push({
          name: prop.getName(),
          type: prop.getTypeAtLocation(declaration).getText(),
          optional: prop.isOptional(),
          readonly: prop.isReadonly(),
        });
      }
    }

    return properties;
  }

  private extractSymbol(node: Node): ASTSymbol {
    let kind: ASTSymbol['kind'] = 'const';

    if (Node.isInterfaceDeclaration(node)) kind = 'interface';
    else if (Node.isTypeAliasDeclaration(node)) kind = 'type';
    else if (Node.isClassDeclaration(node)) kind = 'class';
    else if (Node.isEnumDeclaration(node)) kind = 'enum';
    else if (Node.isFunctionDeclaration(node)) kind = 'function';

    let name = 'unnamed';
    if (Node.hasName(node)) {
      name = node.getName() || 'unnamed';
    }

    const sourceFile = node.getSourceFile();
    const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

    return {
      name,
      kind,
      exported: Node.hasExportKeyword(node),
      location: {
        line,
        column,
        file: sourceFile.getFilePath(),
      },
    };
  }

  private extractEndpointFromFunction(
    fn: FunctionDeclaration,
    filePath: string
  ): APIEndpoint | null {
    const text = fn.getText();
    const name = fn.getName();

    // Pattern detection for API calls
    const patterns = [
      { regex: /fetch\s*\(\s*['"]([^'"]+)['"]\s*,\s*{\s*method\s*:\s*['"]([A-Za-z]+)['"]/i, type: 'fetch' },
      { regex: /axios\.([a-z]+)\s*\(\s*['"]([^'"]+)['"]/i, type: 'axios' },
    ];

    for (const pattern of patterns) {
      const match = pattern.regex.exec(text);
      if (match) {
        let path: string;
        let method: string | undefined;

        if (pattern.type === 'fetch') {
          // fetch(url, { method: 'GET' })
          path = match[1];
          method = match[2];
        } else if (pattern.type === 'axios') {
          // axios.get(url)
          method = match[1];
          path = match[2];
        } else {
          // Fallback: assume [path, method]
          path = match[1];
          method = match[2];
        }

        return {
          path,
          method: (method || 'GET').toUpperCase() as APIEndpoint['method'],
          description: this.getJSDocComment(fn) || `API call in ${name}`,
        };
      }
    }

    return null;
  }

  private getJSDocComment(node: Node): string | undefined {
    const jsDocs = Node.hasJSDoc(node) ? node.getJSDocTags() : [];
    if (jsDocs.length > 0) {
      return jsDocs.map(doc => doc.getText()).join(' ');
    }
    return undefined;
  }
}
