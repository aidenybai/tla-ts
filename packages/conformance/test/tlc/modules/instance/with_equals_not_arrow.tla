(*---
description: WITH needs <-.
ref: "tla2sany/parser/TLAplusParser.java#Substitution"
features: [instance]
outcome: parse-error
---*)
---- MODULE with_equals_not_arrow ----
---- MODULE I ----
CONSTANT c
d == c
====
M == INSTANCE I WITH c = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "<-"
    | Encountered "=" at line 12, column 24 and token "c" 
    | Residual stack trace follows:
    | Substitution starting at line 12, column 22.
    | NonLocalInstance starting at line 12, column 6.
    | Definition starting at line 12, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file with_equals_not_arrow
    | In module with_equals_not_arrow
    | Could not parse module with_equals_not_arrow from file with_equals_not_arrow.tla
    | *** Errors: 1
    | In module with_equals_not_arrow
    | Could not parse module with_equals_not_arrow from file with_equals_not_arrow.tla
    3002:1 Parsing or semantic analysis failed.
---*)
