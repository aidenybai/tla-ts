(*---
description: "-(a, b) is rejected, because - before ( reads as prefix minus on a parenthesized expression."
ref: "tla2sany/parser/TLAplusParser.java#Expression"
features: [operators]
outcome: parse-error
---*)
---- MODULE nonfix_minus_two_arguments_rejected ----
EXTENDS Integers
Test == -(2, 1) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "," at line 9, column 12 and token "2" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 10.
    | Expression starting at line 9, column 9.
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file nonfix_minus_two_arguments_rejected
    | In module nonfix_minus_two_arguments_rejected
    | Could not parse module nonfix_minus_two_arguments_rejected from file nonfix_minus_two_arguments_rejected.tla
    | *** Errors: 1
    | In module nonfix_minus_two_arguments_rejected
    | Could not parse module nonfix_minus_two_arguments_rejected from file nonfix_minus_two_arguments_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
