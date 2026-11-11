(*---
description: Evaluates a random record expression, seed 262, number 1807.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01807 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = ((<<1>> * 1) + (~[a |-> 1, b |-> TRUE]))] EXCEPT !.a = @ + (IF (TRUE \/ FALSE) THEN ({2, 1, 3} \div -1) ELSE (2147483647 \div 1) - (CASE TRUE -> -1 [] OTHER -> 1 * LET b2859 == 0 IN b2859))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 167 to line 14, col 170 of module random_01807 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 157.
    | Expression starting at line 14, column 157.
    | ExtendableExpr starting at line 14, column 156.
    | Expression starting at line 14, column 156.
    | IF THEN ELSE starting at line 14, column 132.
    | Fatal errors while parsing TLA+ spec in file random_01807
    | In module random_01807
    | Could not parse module random_01807 from file random_01807.tla
    | *** Errors: 1
    | In module random_01807
    | Could not parse module random_01807 from file random_01807.tla
    3002:1 Parsing or semantic analysis failed.
---*)
