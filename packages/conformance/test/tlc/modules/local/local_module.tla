(*---
description: LOCAL cannot prefix a nested module.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
outcome: parse-error
---*)
---- MODULE local_module ----
LOCAL ---- MODULE I ----
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "LOCAL ---- MODULE" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file local_module
    | In module local_module
    | Could not parse module local_module from file local_module.tla
    | *** Errors: 1
    | In module local_module
    | Could not parse module local_module from file local_module.tla
    3002:1 Parsing or semantic analysis failed.
---*)
