(*---
description: LOCAL cannot prefix THEOREM.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
outcome: parse-error
---*)
---- MODULE local_theorem ----
LOCAL THEOREM TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "LOCAL THEOREM" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file local_theorem
    | In module local_theorem
    | Could not parse module local_theorem from file local_theorem.tla
    | *** Errors: 1
    | In module local_theorem
    | Could not parse module local_theorem from file local_theorem.tla
    3002:1 Parsing or semantic analysis failed.
---*)
