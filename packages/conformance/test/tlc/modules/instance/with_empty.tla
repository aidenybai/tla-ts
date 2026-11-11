(*---
description: WITH needs a substitution.
ref: "tla2sany/parser/TLAplusParser.java#Substitution"
features: [instance]
outcome: parse-error
---*)
---- MODULE with_empty ----
---- MODULE I ----
CONSTANT c
d == c
====
M == INSTANCE I WITH
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "====" at line 13, column 1 and token "WITH" 
    | Residual stack trace follows:
    | Substitution starting at line 13, column 1.
    | NonLocalInstance starting at line 12, column 6.
    | Definition starting at line 12, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file with_empty
    | In module with_empty
    | Could not parse module with_empty from file with_empty.tla
    | *** Errors: 1
    | In module with_empty
    | Could not parse module with_empty from file with_empty.tla
    3002:1 Parsing or semantic analysis failed.
---*)
