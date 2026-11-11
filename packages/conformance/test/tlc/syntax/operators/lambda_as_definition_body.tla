(*---
description: "LAMBDA may not be a definition's body."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [operators]
outcome: parse-error
---*)
---- MODULE lambda_as_definition_body ----
Op == LAMBDA x : x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Expression or Instance"
    | Encountered "LAMBDA" at line 8, column 7 and token "==" 
    | Residual stack trace follows:
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file lambda_as_definition_body
    | In module lambda_as_definition_body
    | Could not parse module lambda_as_definition_body from file lambda_as_definition_body.tla
    | *** Errors: 1
    | In module lambda_as_definition_body
    | Could not parse module lambda_as_definition_body from file lambda_as_definition_body.tla
    3002:1 Parsing or semantic analysis failed.
---*)
