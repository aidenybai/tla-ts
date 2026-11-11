(*---
description: RECURSIVE needs a name.
ref: "tla2sany/parser/TLAplusParser.java#Recursive"
features: [recursive]
outcome: parse-error
---*)
---- MODULE empty_declaration ----
RECURSIVE
F == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier, _ or prefix op"
    | Encountered "Beginning of definition" at line 9, column 1 and token "RECURSIVE" 
    | Residual stack trace follows:
    | Constant declaration items starting at line 9, column 1.
    | Recursive starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file empty_declaration
    | In module empty_declaration
    | Could not parse module empty_declaration from file empty_declaration.tla
    | *** Errors: 1
    | In module empty_declaration
    | Could not parse module empty_declaration from file empty_declaration.tla
    3002:1 Parsing or semantic analysis failed.
---*)
