(*---
description: Evaluates a random record expression, seed 262, number 8218.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08218 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = (-(DOMAIN [x \in Nat |-> x + 1] % (-1 * 2147483647)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 65 to line 14, col 70 of module random_08218 and %.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 72.
    | Expression starting at line 14, column 65.
    | ExtendableExpr starting at line 14, column 64.
    | Expression starting at line 14, column 63.
    | ExtendableExpr starting at line 14, column 62.
    | Fatal errors while parsing TLA+ spec in file random_08218
    | In module random_08218
    | Could not parse module random_08218 from file random_08218.tla
    | *** Errors: 1
    | In module random_08218
    | Could not parse module random_08218 from file random_08218.tla
    3002:1 Parsing or semantic analysis failed.
---*)
