(*---
description: A LAMBDA parameter may not be an operator.
ref: "tla2sany/parser/TLAplusParser.java#Lambda"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE lambda_operator_parameter ----
Op(F(_)) == F(1)
Test == Op(LAMBDA G(_) : 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "`,' or `:'"
    | Encountered "(" at line 9, column 20 and token "G" 
    | Residual stack trace follows:
    | Lambda starting at line 9, column 12.
    | Optional Arguments starting at line 9, column 11.
    | Primitive expression starting at line 9, column 9.
    | ExtendableExpr starting at line 9, column 9.
    | Expression starting at line 9, column 9.
    | Fatal errors while parsing TLA+ spec in file lambda_operator_parameter
    | In module lambda_operator_parameter
    | Could not parse module lambda_operator_parameter from file lambda_operator_parameter.tla
    | *** Errors: 1
    | In module lambda_operator_parameter
    | Could not parse module lambda_operator_parameter from file lambda_operator_parameter.tla
    3002:1 Parsing or semantic analysis failed.
---*)
