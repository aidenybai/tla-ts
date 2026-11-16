(*---
description: A reserved word cannot be declared a VARIABLE.
ref: "tla2sany/parser/TLAplusParser.java#VariableDeclaration"
features: [reserved]
outcome: parse-error
---*)
---- MODULE used_as_variable_declaration ----
VARIABLE IF
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier"
    | Encountered "IF" at line 8, column 10 and token "VARIABLE" 
    | Residual stack trace follows:
    | variable declaration starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file used_as_variable_declaration
    | In module used_as_variable_declaration
    | Could not parse module used_as_variable_declaration from file used_as_variable_declaration.tla
    | *** Errors: 1
    | In module used_as_variable_declaration
    | Could not parse module used_as_variable_declaration from file used_as_variable_declaration.tla
    3002:1 Parsing or semantic analysis failed.
---*)
