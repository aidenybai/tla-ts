(*---
description: NEW is only legal in ASSUME/PROVE.
ref: "tla2sany/parser/TLAplusParser.java#NewSymb"
features: [proofs]
outcome: parse-error
---*)
---- MODULE new_outside_assume ----
THEOREM NEW x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "THEOREM NEW" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file new_outside_assume
    | In module new_outside_assume
    | Could not parse module new_outside_assume from file new_outside_assume.tla
    | *** Errors: 1
    | In module new_outside_assume
    | Could not parse module new_outside_assume from file new_outside_assume.tla
    3002:1 Parsing or semantic analysis failed.
---*)
