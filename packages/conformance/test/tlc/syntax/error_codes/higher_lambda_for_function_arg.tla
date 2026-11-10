(*---
description: A LAMBDA as a function argument is rejected.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_lambda_for_function_arg ----
f[x \in {1}] == x
A == f[LAMBDA x : 1]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "LAMBDA" at line 9, column 8 and token "[" 
    | Residual stack trace follows:
    | Some [] Form starting at line 9, column 7.
    | ExtendableExpr starting at line 9, column 6.
    | Expression starting at line 9, column 6.
    | Definition starting at line 9, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file higher_lambda_for_function_arg
    | In module higher_lambda_for_function_arg
    | Could not parse module higher_lambda_for_function_arg from file higher_lambda_for_function_arg.tla
    | *** Errors: 1
    | In module higher_lambda_for_function_arg
    | Could not parse module higher_lambda_for_function_arg from file higher_lambda_for_function_arg.tla
    3002:1 Parsing or semantic analysis failed.
---*)
