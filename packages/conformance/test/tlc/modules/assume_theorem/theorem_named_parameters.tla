(*---
description: "A theorem's name takes no parameters."
ref: "tla2sany/parser/TLAplusParser.java#Theorem"
features: [assume_theorem]
outcome: parse-error
---*)
---- MODULE theorem_named_parameters ----
THEOREM T(x) == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier, Assume-Prove or Expression"
    | Encountered "Beginning of definition" at line 8, column 9 and token "THEOREM" 
    | Residual stack trace follows:
    | Theorem starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file theorem_named_parameters
    | In module theorem_named_parameters
    | Could not parse module theorem_named_parameters from file theorem_named_parameters.tla
    | *** Errors: 1
    | In module theorem_named_parameters
    | Could not parse module theorem_named_parameters from file theorem_named_parameters.tla
    3002:1 Parsing or semantic analysis failed.
---*)
