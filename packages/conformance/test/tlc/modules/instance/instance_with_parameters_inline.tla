(*---
description: INSTANCE takes no parameters on the module name.
ref: "tla2sany/parser/TLAplusParser.java#Instantiation"
features: [instance]
outcome: parse-error
---*)
---- MODULE instance_with_parameters_inline ----
---- MODULE I ----
====
INSTANCE I(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "(" at line 10, column 11 and token "I" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file instance_with_parameters_inline
    | In module instance_with_parameters_inline
    | Could not parse module instance_with_parameters_inline from file instance_with_parameters_inline.tla
    | *** Errors: 1
    | In module instance_with_parameters_inline
    | Could not parse module instance_with_parameters_inline from file instance_with_parameters_inline.tla
    3002:1 Parsing or semantic analysis failed.
---*)
