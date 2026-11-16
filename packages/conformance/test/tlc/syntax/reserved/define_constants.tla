(*---
description: "CONSTANTS is reserved, so it cannot be the name of a definition."
ref: tla2sany/parser/TLAplusParserConstants.java
features: [reserved]
outcome: parse-error
---*)
---- MODULE define_constants ----
CONSTANTS == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "Beginning of definition CONSTANTS" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_constants
    | In module define_constants
    | Could not parse module define_constants from file define_constants.tla
    | *** Errors: 1
    | In module define_constants
    | Could not parse module define_constants from file define_constants.tla
    3002:1 Parsing or semantic analysis failed.
---*)
