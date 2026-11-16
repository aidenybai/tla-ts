(*---
description: A decimal needs digits before the dot.
ref: "tla2sany/parser/TLAplusParser.java#Number"
features: [numbers]
outcome: parse-error
---*)
---- MODULE real_no_integer_part ----
ASSUME .5 = .5
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "ASSUME ." at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file real_no_integer_part
    | In module real_no_integer_part
    | Could not parse module real_no_integer_part from file real_no_integer_part.tla
    | *** Errors: 1
    | In module real_no_integer_part
    | Could not parse module real_no_integer_part from file real_no_integer_part.tla
    3002:1 Parsing or semantic analysis failed.
---*)
