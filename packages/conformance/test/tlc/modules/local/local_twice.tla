(*---
description: LOCAL cannot repeat.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
outcome: parse-error
---*)
---- MODULE local_twice ----
LOCAL LOCAL A == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "LOCAL LOCAL" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file local_twice
    | In module local_twice
    | Could not parse module local_twice from file local_twice.tla
    | *** Errors: 1
    | In module local_twice
    | Could not parse module local_twice from file local_twice.tla
    3002:1 Parsing or semantic analysis failed.
---*)
