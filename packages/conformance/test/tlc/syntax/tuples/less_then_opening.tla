(*---
description: "1<<<2>> reads << first, so it never reaches the less-than."
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
outcome: parse-error
---*)
---- MODULE less_then_opening ----
EXTENDS Naturals
Test == 1<<<2>>[1]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "<<" at line 9, column 10 and token "1" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file less_then_opening
    | In module less_then_opening
    | Could not parse module less_then_opening from file less_then_opening.tla
    | *** Errors: 1
    | In module less_then_opening
    | Could not parse module less_then_opening from file less_then_opening.tla
    3002:1 Parsing or semantic analysis failed.
---*)
