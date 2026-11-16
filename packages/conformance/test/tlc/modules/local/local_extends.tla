(*---
description: LOCAL cannot prefix EXTENDS.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
outcome: parse-error
---*)
---- MODULE local_extends ----
LOCAL EXTENDS Naturals
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "LOCAL EXTENDS" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file local_extends
    | In module local_extends
    | Could not parse module local_extends from file local_extends.tla
    | *** Errors: 1
    | In module local_extends
    | Could not parse module local_extends from file local_extends.tla
    3002:1 Parsing or semantic analysis failed.
---*)
