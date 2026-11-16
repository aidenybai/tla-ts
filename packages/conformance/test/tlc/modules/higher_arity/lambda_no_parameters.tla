(*---
description: A LAMBDA needs parameters.
ref: "tla2sany/parser/TLAplusParser.java#Lambda"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE lambda_no_parameters ----
Op(F(_)) == F(1)
Test == Op(LAMBDA : 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier"
    | Encountered ":" at line 9, column 19 and token "LAMBDA" 
    | Residual stack trace follows:
    | Lambda starting at line 9, column 12.
    | Optional Arguments starting at line 9, column 11.
    | Primitive expression starting at line 9, column 9.
    | ExtendableExpr starting at line 9, column 9.
    | Expression starting at line 9, column 9.
    | Fatal errors while parsing TLA+ spec in file lambda_no_parameters
    | In module lambda_no_parameters
    | Could not parse module lambda_no_parameters from file lambda_no_parameters.tla
    | *** Errors: 1
    | In module lambda_no_parameters
    | Could not parse module lambda_no_parameters from file lambda_no_parameters.tla
    3002:1 Parsing or semantic analysis failed.
---*)
