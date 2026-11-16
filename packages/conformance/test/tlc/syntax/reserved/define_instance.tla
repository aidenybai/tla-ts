(*---
description: "INSTANCE is reserved, so it cannot be the name of a definition."
ref: tla2sany/parser/TLAplusParserConstants.java
features: [reserved]
outcome: parse-error
---*)
---- MODULE define_instance ----
INSTANCE == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "Beginning of definition INSTANCE" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_instance
    | In module define_instance
    | Could not parse module define_instance from file define_instance.tla
    | *** Errors: 1
    | In module define_instance
    | Could not parse module define_instance from file define_instance.tla
    3002:1 Parsing or semantic analysis failed.
---*)
