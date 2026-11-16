(*---
description: A reserved word cannot be declared a CONSTANT.
ref: "tla2sany/parser/TLAplusParser.java#ConstantDeclarationItems"
features: [reserved]
outcome: parse-error
---*)
---- MODULE used_as_constant_declaration ----
CONSTANT THEN
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier, _ or prefix op"
    | Encountered "THEN" at line 8, column 10 and token "CONSTANT" 
    | Residual stack trace follows:
    | Constant declaration items starting at line 8, column 10.
    | Parameter declaration starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file used_as_constant_declaration
    | In module used_as_constant_declaration
    | Could not parse module used_as_constant_declaration from file used_as_constant_declaration.tla
    | *** Errors: 1
    | In module used_as_constant_declaration
    | Could not parse module used_as_constant_declaration from file used_as_constant_declaration.tla
    3002:1 Parsing or semantic analysis failed.
---*)
