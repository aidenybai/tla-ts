(*---
description: A decimal needs digits after the dot.
ref: "tla2sany/parser/TLAplusParser.java#Number"
features: [numbers]
outcome: parse-error
---*)
---- MODULE real_no_fraction ----
ASSUME 1. = 1.
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "=" at line 8, column 11 and token "." 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 8.
    | Expression starting at line 8, column 8.
    | Assumption starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file real_no_fraction
    | In module real_no_fraction
    | Could not parse module real_no_fraction from file real_no_fraction.tla
    | *** Errors: 1
    | In module real_no_fraction
    | Could not parse module real_no_fraction from file real_no_fraction.tla
    3002:1 Parsing or semantic analysis failed.
---*)
