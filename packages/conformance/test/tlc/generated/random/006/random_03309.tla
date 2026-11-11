(*---
description: Evaluates a random bool expression, seed 262, number 3309.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03309 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b5258 \in DOMAIN [(2..1 \ {}) EXCEPT ![(3 % [a |-> 1])] = (-1 \div -1)] : (\E b5259 \in {Head(<<3, 1, 2>>), (2 + 1)} : ({b5258, 0} < (1 % b5258)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 82 to line 14, col 85 of module random_03309 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 80.
    | Expression starting at line 14, column 79.
    | ExtendableExpr starting at line 14, column 78.
    | Expression starting at line 14, column 78.
    | Except Spec starting at line 14, column 57.
    | Fatal errors while parsing TLA+ spec in file random_03309
    | In module random_03309
    | Could not parse module random_03309 from file random_03309.tla
    | *** Errors: 1
    | In module random_03309
    | Could not parse module random_03309 from file random_03309.tla
    3002:1 Parsing or semantic analysis failed.
---*)
