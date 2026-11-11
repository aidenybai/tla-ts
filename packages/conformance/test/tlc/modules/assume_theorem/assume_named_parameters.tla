(*---
description: "An assumption's name takes no parameters."
ref: "tla2sany/parser/TLAplusParser.java#Assumption"
features: [assume_theorem]
outcome: parse-error
---*)
---- MODULE assume_named_parameters ----
ASSUME A(x) == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "=="
    | Encountered "(" at line 8, column 9 and token "A" 
    | Residual stack trace follows:
    | Assumption starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file assume_named_parameters
    | In module assume_named_parameters
    | Could not parse module assume_named_parameters from file assume_named_parameters.tla
    | *** Errors: 1
    | In module assume_named_parameters
    | Could not parse module assume_named_parameters from file assume_named_parameters.tla
    3002:1 Parsing or semantic analysis failed.
---*)
