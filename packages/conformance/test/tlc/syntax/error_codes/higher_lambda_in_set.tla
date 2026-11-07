(*---
description: A LAMBDA as a set element is rejected.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_lambda_in_set ----
A == {LAMBDA x : 1}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "LAMBDA" at line 8, column 7 and token "{" 
    | Residual stack trace follows:
    | Some { } form starting at line 8, column 6.
    | ExtendableExpr starting at line 8, column 6.
    | Expression starting at line 8, column 6.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file higher_lambda_in_set
    | In module higher_lambda_in_set
    | Could not parse module higher_lambda_in_set from file higher_lambda_in_set.tla
    | *** Errors: 1
    | In module higher_lambda_in_set
    | Could not parse module higher_lambda_in_set from file higher_lambda_in_set.tla
    3002:1 Parsing or semantic analysis failed.
---*)
