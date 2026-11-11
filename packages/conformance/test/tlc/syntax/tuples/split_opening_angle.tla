(*---
description: < < is not an opening <<.
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
outcome: parse-error
---*)
---- MODULE split_opening_angle ----
Test == < <1>> = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "<1>" at line 8, column 11 and token "<" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file split_opening_angle
    | In module split_opening_angle
    | Could not parse module split_opening_angle from file split_opening_angle.tla
    | *** Errors: 1
    | In module split_opening_angle
    | Could not parse module split_opening_angle from file split_opening_angle.tla
    3002:1 Parsing or semantic analysis failed.
---*)
