(*---
description: Non-associative = cannot chain.
ref: "tla2sany/parser/Operators.java#CanonicalOperators"
features: [operators]
outcome: parse-error
---*)
---- MODULE precedence_conflict_equals_chain ----
Test == 1 = 1 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops = in block line 8, col 11 to line 8, col 11 of module precedence_conflict_equals_chain and =.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 13.
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file precedence_conflict_equals_chain
    | In module precedence_conflict_equals_chain
    | Could not parse module precedence_conflict_equals_chain from file precedence_conflict_equals_chain.tla
    | *** Errors: 1
    | In module precedence_conflict_equals_chain
    | Could not parse module precedence_conflict_equals_chain from file precedence_conflict_equals_chain.tla
    3002:1 Parsing or semantic analysis failed.
---*)
