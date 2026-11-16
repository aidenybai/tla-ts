(*---
description: Evaluates a random record expression, seed 262, number 9029.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09029 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = @ + (3 + 1)]).a, b |-> ((CHOOSE b14028 \in (-1 .. 7) : ({} = [x \in 1..2 |-> x])) < IF (-1 < -1) THEN (<<5, 6>>)[3] ELSE (2 * -1))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 201 to line 14, col 201 of module random_09029 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 199.
    | Expression starting at line 14, column 199.
    | ExtendableExpr starting at line 14, column 198.
    | Expression starting at line 14, column 198.
    | IF THEN ELSE starting at line 14, column 161.
    | Fatal errors while parsing TLA+ spec in file random_09029
    | In module random_09029
    | Could not parse module random_09029 from file random_09029.tla
    | *** Errors: 1
    | In module random_09029
    | Could not parse module random_09029 from file random_09029.tla
    3002:1 Parsing or semantic analysis failed.
---*)
