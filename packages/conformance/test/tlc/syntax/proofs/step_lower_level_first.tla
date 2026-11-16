(*---
description: "A nested proof's level must be higher than the enclosing level."
ref: "tla2sany/parser/TLAplusParser.java#correctLevel"
features: [proofs]
outcome: parse-error
---*)
---- MODULE step_lower_level_first ----
THEOREM TRUE
<2>1. TRUE
  <1>1. TRUE
  <1> QED
<2> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Step number"
    | line 10, col 3 to line 10, col 7 of module step_lower_level_first: step's number has bad level.
    | Residual stack trace follows:
    | Step starting at line 10, column 3.
    | Proof starting at line 9, column 1.
    | Theorem starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file step_lower_level_first
    | In module step_lower_level_first
    | Could not parse module step_lower_level_first from file step_lower_level_first.tla
    | *** Errors: 1
    | In module step_lower_level_first
    | Could not parse module step_lower_level_first from file step_lower_level_first.tla
    3002:1 Parsing or semantic analysis failed.
---*)
