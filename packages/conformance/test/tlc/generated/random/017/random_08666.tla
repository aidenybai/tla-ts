(*---
description: Evaluates a random bool expression, seed 262, number 8666.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08666 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b13411 \in (UNION {{2, 1, 3}, SUBSET {1}} \ (7 .. 2147483647)) : ((2147483647 \div -1) < (7 \div 3))) => (((2..1 \ Nat) \cap (7 .. -1)) = ({7 : b13412 \in {1}} \cap UNION {{1}, SUBSET {1}}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 99 to line 14, col 102 of module random_08666 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 88.
    | Expression starting at line 14, column 88.
    | ExtendableExpr starting at line 14, column 87.
    | Expression starting at line 14, column 87.
    | ExtendableExpr starting at line 14, column 86.
    | Fatal errors while parsing TLA+ spec in file random_08666
    | In module random_08666
    | Could not parse module random_08666 from file random_08666.tla
    | *** Errors: 1
    | In module random_08666
    | Could not parse module random_08666 from file random_08666.tla
    3002:1 Parsing or semantic analysis failed.
---*)
