(*---
description: Evaluates a random set expression, seed 262, number 4542.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04542 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (\E b7124 \in {3 : b7125 \in 1..3} : (\E b7126 \in {2, 1, 3} : TRUE)) THEN ((-1 \div -1) - LET b7127 == 1 IN b7127) ELSE ((CHOOSE r \in [a : {1}] : TRUE) + ([a |-> 1]).a), IF (\A b7128 \in (1..3 \ 2..1) : (0 < 3)) THEN ([a |-> <<3, 1, 2>>, b |-> FALSE]).a ELSE ((-3) + (3 - 1))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 100 to line 14, col 103 of module random_04542 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 98.
    | Expression starting at line 14, column 97.
    | ExtendableExpr starting at line 14, column 96.
    | Expression starting at line 14, column 96.
    | ExtendableExpr starting at line 14, column 95.
    | Fatal errors while parsing TLA+ spec in file random_04542
    | In module random_04542
    | Could not parse module random_04542 from file random_04542.tla
    | *** Errors: 1
    | In module random_04542
    | Could not parse module random_04542 from file random_04542.tla
    3002:1 Parsing or semantic analysis failed.
---*)
