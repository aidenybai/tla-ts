(*---
description: Evaluates a random set expression, seed 262, number 5470.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05470 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Cardinality((2147483647 .. [a |-> 1])), IF (FALSE \/ FALSE) THEN Len({1}) ELSE (0 * -1)} \ ({LET b8465 == b8464 IN b8464 : b8464 \in ({2, 1, 3} \cap {})} \cap UNION {{-1 : b8466 \in {2, 1, 3}}, {0, 7}})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 100 to line 14, col 100 of module random_05470 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 98.
    | Expression starting at line 14, column 98.
    | ExtendableExpr starting at line 14, column 97.
    | Expression starting at line 14, column 97.
    | IF THEN ELSE starting at line 14, column 58.
    | Fatal errors while parsing TLA+ spec in file random_05470
    | In module random_05470
    | Could not parse module random_05470 from file random_05470.tla
    | *** Errors: 1
    | In module random_05470
    | Could not parse module random_05470 from file random_05470.tla
    3002:1 Parsing or semantic analysis failed.
---*)
