(*---
description: Evaluates a random record expression, seed 262, number 2721.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02721 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + (-(UNION {{}, 2..1} * Head([x \in 1..2 |-> x])))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 68 to line 14, col 72 of module random_02721 and *.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 74.
    | Expression starting at line 14, column 68.
    | ExtendableExpr starting at line 14, column 67.
    | Expression starting at line 14, column 66.
    | ExtendableExpr starting at line 14, column 65.
    | Fatal errors while parsing TLA+ spec in file random_02721
    | In module random_02721
    | Could not parse module random_02721 from file random_02721.tla
    | *** Errors: 1
    | In module random_02721
    | Could not parse module random_02721 from file random_02721.tla
    3002:1 Parsing or semantic analysis failed.
---*)
