(*---
description: Evaluates a random record expression, seed 262, number 1586.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01586 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + (LET b2530 == (-7) IN IF FALSE THEN b2530 ELSE 3 \div ([[a |-> 1] EXCEPT !.a = -1] * (1 \div -1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 163 to line 14, col 166 of module random_01586 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 161.
    | Expression starting at line 14, column 161.
    | ExtendableExpr starting at line 14, column 160.
    | ExtendableExpr starting at line 14, column 130.
    | Expression starting at line 14, column 130.
    | Fatal errors while parsing TLA+ spec in file random_01586
    | In module random_01586
    | Could not parse module random_01586 from file random_01586.tla
    | *** Errors: 1
    | In module random_01586
    | Could not parse module random_01586 from file random_01586.tla
    3002:1 Parsing or semantic analysis failed.
---*)
