(*---
description: LOCAL cannot prefix RECURSIVE.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
outcome: parse-error
---*)
---- MODULE local_recursive ----
LOCAL RECURSIVE f(_)
f(x) == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "LOCAL RECURSIVE" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file local_recursive
    | In module local_recursive
    | Could not parse module local_recursive from file local_recursive.tla
    | *** Errors: 1
    | In module local_recursive
    | Could not parse module local_recursive from file local_recursive.tla
    3002:1 Parsing or semantic analysis failed.
---*)
