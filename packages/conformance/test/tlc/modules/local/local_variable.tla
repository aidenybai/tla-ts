(*---
description: LOCAL cannot prefix VARIABLE.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
outcome: parse-error
---*)
---- MODULE local_variable ----
LOCAL VARIABLE v
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "LOCAL VARIABLE" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file local_variable
    | In module local_variable
    | Could not parse module local_variable from file local_variable.tla
    | *** Errors: 1
    | In module local_variable
    | Could not parse module local_variable from file local_variable.tla
    3002:1 Parsing or semantic analysis failed.
---*)
