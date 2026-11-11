(*---
description: A dot is not part of a name.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE dot ----
a.b == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "a" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file dot
    | In module dot
    | Could not parse module dot from file dot.tla
    | *** Errors: 1
    | In module dot
    | Could not parse module dot from file dot.tla
    3002:1 Parsing or semantic analysis failed.
---*)
