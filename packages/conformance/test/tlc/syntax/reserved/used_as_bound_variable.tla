(*---
description: A reserved word cannot name a bound variable.
ref: "tla2sany/parser/TLAplusParser.java#QuantBound"
features: [reserved]
outcome: parse-error
---*)
---- MODULE used_as_bound_variable ----
Test == \A LET \in {1} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "LET" at line 8, column 12 and token "\\A" 
    | Residual stack trace follows:
    | Quantified form starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file used_as_bound_variable
    | In module used_as_bound_variable
    | Could not parse module used_as_bound_variable from file used_as_bound_variable.tla
    | *** Errors: 1
    | In module used_as_bound_variable
    | Could not parse module used_as_bound_variable from file used_as_bound_variable.tla
    3002:1 Parsing or semantic analysis failed.
---*)
