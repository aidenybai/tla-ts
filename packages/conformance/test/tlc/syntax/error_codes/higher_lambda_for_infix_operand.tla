(*---
description: A LAMBDA as an infix operand is rejected.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_lambda_for_infix_operand ----
EXTENDS Naturals
A == (LAMBDA x : 1) + 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "LAMBDA" at line 9, column 7 and token "(" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 7.
    | Expression starting at line 9, column 7.
    | ExtendableExpr starting at line 9, column 6.
    | Expression starting at line 9, column 6.
    | Definition starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file higher_lambda_for_infix_operand
    | In module higher_lambda_for_infix_operand
    | Could not parse module higher_lambda_for_infix_operand from file higher_lambda_for_infix_operand.tla
    | *** Errors: 1
    | In module higher_lambda_for_infix_operand
    | Could not parse module higher_lambda_for_infix_operand from file higher_lambda_for_infix_operand.tla
    3002:1 Parsing or semantic analysis failed.
---*)
