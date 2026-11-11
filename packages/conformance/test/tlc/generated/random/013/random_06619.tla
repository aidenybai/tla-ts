(*---
description: Evaluates a random record expression, seed 262, number 6619.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06619 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (\E b10159 \in DOMAIN {1, 2} : (~TRUE)) THEN ((<<1, 2>> \in 1..3) \/ (FALSE \/ FALSE)) ELSE CASE [[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] -> (<<>> \div 2) [] OTHER -> (0 * FALSE), b |-> (Head(Append(<<>>, 1)) < (([x \in 1..2 |-> x])[3] + (2 \div -1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 265 to line 14, col 268 of module random_06619 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 263.
    | Expression starting at line 14, column 263.
    | ExtendableExpr starting at line 14, column 262.
    | ExtendableExpr starting at line 14, column 236.
    | Expression starting at line 14, column 236.
    | Fatal errors while parsing TLA+ spec in file random_06619
    | In module random_06619
    | Could not parse module random_06619 from file random_06619.tla
    | *** Errors: 1
    | In module random_06619
    | Could not parse module random_06619 from file random_06619.tla
    3002:1 Parsing or semantic analysis failed.
---*)
