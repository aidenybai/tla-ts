(*---
description: A reserved word cannot name an operator parameter.
ref: "tla2sany/parser/TLAplusParser.java#IdentifierTuple"
features: [reserved]
outcome: parse-error
---*)
---- MODULE used_as_parameter_if ----
Op(IF) == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier Declaration, prefix op, _ or )"
    | Encountered "IF" at line 8, column 4 and token "(" 
    | Residual stack trace follows:
    | Identifier LHS starting at line 8, column 1.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file used_as_parameter_if
    | In module used_as_parameter_if
    | Could not parse module used_as_parameter_if from file used_as_parameter_if.tla
    | *** Errors: 1
    | In module used_as_parameter_if
    | Could not parse module used_as_parameter_if from file used_as_parameter_if.tla
    3002:1 Parsing or semantic analysis failed.
---*)
