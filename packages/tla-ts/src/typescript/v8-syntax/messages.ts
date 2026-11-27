// Ported from V8 src/common/message-template.h; see LICENSE-v8.
// V8's MessageTemplates (src/common/message-template.h) that its parser reports, by their names in V8,
// where % stands for an argument.
const MESSAGES = {
  kArgumentsDisallowedInInitializerAndStaticBlock:
    "'arguments' is not allowed in class field initializer or static initialization block",
  kAsyncFunctionInSingleStatementContext:
    "Async functions can only be declared at the top level or inside a block.",
  kAwaitBindingIdentifier: "'await' is not a valid identifier name in an async function",
  kAwaitExpressionFormalParameter:
    "Illegal await-expression in formal parameters of async function",
  kAwaitNotInAsyncContext:
    "await is only valid in async functions and the top level bodies of modules",
  kBadGetterArity: "Getter must not have any formal parameters.",
  kBadSetterArity: "Setter must have exactly one formal parameter.",
  kBadSetterRestParameter: "Setter function argument must not be a rest parameter",
  kConstructorClassField: "Classes may not have a field named 'constructor'",
  kConstructorIsAccessor: "Class constructor may not be an accessor",
  kConstructorIsAsync: "Class constructor may not be an async method",
  kConstructorIsGenerator: "Class constructor may not be a generator",
  kConstructorIsPrivate: "Class constructor may not be a private method",
  kContinuousNumericSeparator: "Only one underscore is allowed as numeric separator",
  kDeclarationMissingInitializer: "Missing initializer in % declaration",
  kDeletePrivateField: "Private fields can not be deleted",
  kDuplicateConstructor: "A class may only have one constructor",
  kDuplicateExport: "Duplicate export of '%'",
  kDuplicateProto: "Duplicate __proto__ fields are not allowed in object literals",
  kElementAfterRest: "Rest element must be last element",
  kForInOfLoopInitializer: "% loop variable declaration may not have an initializer.",
  kForInOfLoopMultiBindings: "Invalid left-hand side in % loop: Must have a single binding.",
  kForOfAsync: "The left-hand side of a for-of loop may not be 'async'.",
  kForOfLet: "The left-hand side of a for-of loop may not start with 'let'.",
  kGeneratorInSingleStatementContext:
    "Generators can only be declared at the top level or inside a block.",
  kHtmlCommentInModule: "HTML comments are not allowed in modules",
  kIllegalBreak: "Illegal break statement",
  kIllegalContinue: "Illegal continue statement: '%' does not denote an iteration statement",
  kIllegalLanguageModeDirective: "Illegal '%' directive in function with non-simple parameter list",
  kIllegalReturn: "Illegal return statement",
  kImportAttributesDuplicateKey: "Import attribute has duplicate key '%'",
  kImportCallNotNewExpression: "Cannot use new with import",
  kImportMetaOutsideModule: "Cannot use 'import.meta' outside a module",
  kImportMissingSpecifier: "import() requires a specifier",
  kImportOutsideModule: "Cannot use import statement outside a module",
  kInvalidCoverInitializedName: "Invalid shorthand property initializer",
  kInvalidDestructuringTarget: "Invalid destructuring assignment target",
  kInvalidEscapedMetaProperty: "'%' must not contain escaped characters",
  kInvalidEscapedReservedWord: "Keyword must not contain escaped characters",
  kInvalidHexEscapeSequence: "Invalid hexadecimal escape sequence",
  kInvalidLhsInAssignment: "Invalid left-hand side in assignment",
  kInvalidLhsInFor: "Invalid left-hand side in for-loop",
  kInvalidLhsInPostfixOp: "Invalid left-hand side expression in postfix operation",
  kInvalidLhsInPrefixOp: "Invalid left-hand side expression in prefix operation",
  kInvalidModuleExportName: "Invalid module export name: contains unpaired surrogate",
  kInvalidOrUnexpectedToken: "Invalid or unexpected token",
  kInvalidPrivateFieldResolution: "Private field '%' must be declared in an enclosing class",
  kInvalidPropertyBindingPattern: "Illegal property in declaration context",
  kInvalidRestAssignmentPattern:
    "`...` must be followed by an assignable reference in assignment contexts",
  kInvalidRestBindingPattern: "`...` must be followed by an identifier in declaration contexts",
  kInvalidUnicodeEscapeSequence: "Invalid Unicode escape sequence",
  kInvalidUsingInForInLoop: "Invalid 'using' in for-in loop",
  kLabelRedeclaration: "Label '%' has already been declared",
  kLetInLexicalBinding: "let is disallowed as a lexically bound name",
  kMalformedArrowFunParamList: "Malformed arrow function parameter list",
  kMalformedRegExp: "Invalid regular expression: /%/%: %",
  kMalformedRegExpFlags: "Invalid regular expression flags",
  kMissingFunctionName: "Function statements require a function name",
  kModuleExportNameWithoutFromClause:
    "String literal module export names must be followed by a 'from' clause",
  kModuleExportUndefined: "Export '%' is not defined in module",
  kMultipleDefaultsInSwitch: "More than one default clause in switch statement",
  kNewlineAfterThrow: "Illegal newline after throw",
  kNoCatchOrFinally: "Missing catch or finally after try",
  kNoIterationStatement: "Illegal continue statement: no surrounding iteration statement",
  kOptionalChainingNoNew: "Invalid optional chain from new expression",
  kOptionalChainingNoSuper: "Invalid optional chain from super property",
  kOptionalChainingNoTemplate: "Invalid tagged template on optional chain",
  kParamAfterRest: "Rest parameter must be last formal parameter",
  kParamDupe: "Duplicate parameter name not allowed in this context",
  kRestDefaultInitializer: "Rest parameter may not have a default initializer",
  kSloppyFunction:
    "In non-strict mode code, functions can only be declared at top level, inside a block, or as the body of an if statement.",
  kStaticPrototype: "Classes may not have a static property named 'prototype'",
  kStrict8Or9Escape: "\\8 and \\9 are not allowed in strict mode.",
  kStrictDecimalWithLeadingZero: "Decimals with leading zeros are not allowed in strict mode.",
  kStrictDelete: "Delete of an unqualified identifier in strict mode.",
  kStrictEvalArguments: "Unexpected eval or arguments in strict mode",
  kStrictFunction:
    "In strict mode code, functions can only be declared at top level or inside a block.",
  kStrictOctalEscape: "Octal escape sequences are not allowed in strict mode.",
  kStrictOctalLiteral: "Octal literals are not allowed in strict mode.",
  kStrictWith: "Strict mode code may not include a with statement",
  kTemplate8Or9Escape: "\\8 and \\9 are not allowed in template strings.",
  kTemplateOctalLiteral: "Octal escape sequences are not allowed in template strings.",
  kTooManyArguments: "Too many arguments in function call (only 65525 allowed)",
  kTooManyParameters: "Too many parameters in function definition (only 65534 allowed)",
  kTrailingNumericSeparator: "Numeric separators are not allowed at the end of numeric literals",
  kUndefinedUnicodeCodePoint: "Undefined Unicode code-point",
  kUnexpectedEOS: "Unexpected end of input",
  kUnexpectedLexicalDeclaration: "Lexical declaration cannot appear in a single-statement context",
  kUnexpectedNewTarget: "new.target expression is not allowed here",
  kUnexpectedPrivateField: "Unexpected private field",
  kUnexpectedReserved: "Unexpected reserved word",
  kUnexpectedStrictReserved: "Unexpected strict mode reserved word",
  kUnexpectedSuper: "'super' keyword unexpected here",
  kUnexpectedTemplateString: "Unexpected template string",
  kUnexpectedToken: "Unexpected token '%'",
  kUnexpectedTokenIdentifier: "Unexpected identifier '%'",
  kUnexpectedTokenNumber: "Unexpected number",
  kUnexpectedTokenRegExp: "Unexpected regular expression",
  kUnexpectedTokenString: "Unexpected string",
  kUnexpectedTokenUnaryExponentiation:
    "Unary operator used immediately before exponentiation expression. Parenthesis must be used to disambiguate operator precedence",
  kUnknownLabel: "Undefined label '%'",
  kUnterminatedArgList: "missing ) after argument list",
  kUnterminatedRegExp: "Invalid regular expression: missing /",
  kUnterminatedTemplateExpr: "Missing } in template expression",
  kVarRedeclaration: "Identifier '%' has already been declared",
  kYieldInParameter: "Yield expression not allowed in formal parameter",
  kZeroDigitNumericSeparator: "Numeric separator can not be used after leading 0.",
};

export type MessageName = keyof typeof MESSAGES;

// A message with its arguments in place of its %s, where V8 writes undefined for a missing one.
export const formatMessage = (name: MessageName, args: readonly (string | undefined)[]) => {
  let index = 0;
  return MESSAGES[name].replace(/%/g, () => {
    const arg = args[index];
    index += 1;
    return arg ?? "undefined";
  });
};
