(*---
description: "A LAMBDA is not an expression and cannot stand alone."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE lambda_as_value ----
EXTENDS Integers
Test == (LAMBDA x : x) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "LAMBDA" at line 9, column 10 and token "(" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 10.
    | Expression starting at line 9, column 10.
    | ExtendableExpr starting at line 9, column 9.
    | Expression starting at line 9, column 9.
    | Definition starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file lambda_as_value
    | In module lambda_as_value
    | Could not parse module lambda_as_value from file lambda_as_value.tla
    | *** Errors: 1
    | In module lambda_as_value
    | Could not parse module lambda_as_value from file lambda_as_value.tla
    3002:1 Parsing or semantic analysis failed.
---*)
