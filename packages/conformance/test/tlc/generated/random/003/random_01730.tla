(*---
description: Evaluates a random function expression, seed 262, number 1730.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01730 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b2751 \in ({b2752 \in {x \in 1..3 : x > 1} : TRUE} \cap (TRUE .. 2147483647)) |-> ([a |-> 1, b |-> TRUE] - (2 \div -1))] EXCEPT ![(IF (7 < 3) THEN ([a |-> 1, b |-> TRUE]).a ELSE (1 + 7) \div ((CHOOSE r \in [a : 1..2] : TRUE)).a)] = (((2147483647 \div 0) * (7 * 2)) - (([a |-> 1, b |-> TRUE]).a - (3 \div -1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 128 to line 14, col 131 of module random_01730 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 126.
    | Expression starting at line 14, column 126.
    | ExtendableExpr starting at line 14, column 125.
    | ExtendableExpr starting at line 14, column 101.
    | Expression starting at line 14, column 101.
    | Fatal errors while parsing TLA+ spec in file random_01730
    | In module random_01730
    | Could not parse module random_01730 from file random_01730.tla
    | *** Errors: 1
    | In module random_01730
    | Could not parse module random_01730 from file random_01730.tla
    3002:1 Parsing or semantic analysis failed.
---*)
