(*---
description: "-- is its own infix token, so --1 has no left operand."
ref: tla2sany/parser/TLAplusParserConstants.java
features: [numbers]
outcome: parse-error
---*)
---- MODULE double_negative_no_space ----
EXTENDS Integers
Test == --1 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "1" at line 9, column 11 and token "--" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file double_negative_no_space
    | In module double_negative_no_space
    | Could not parse module double_negative_no_space from file double_negative_no_space.tla
    | *** Errors: 1
    | In module double_negative_no_space
    | Could not parse module double_negative_no_space from file double_negative_no_space.tla
    3002:1 Parsing or semantic analysis failed.
---*)
