(*---
description: Evaluates a random bool expression, seed 262, number 4377.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04377 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<3, 1, 2>>) + Len(<<3, 1, 2>>)) % ((0 \div -1) + (1 * -1))) = ((CHOOSE f \in [{} -> {1, 2}] : TRUE))[Len(<<0, 3>>)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 62 to line 14, col 65 of module random_04377 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 60.
    | Expression starting at line 14, column 60.
    | ExtendableExpr starting at line 14, column 59.
    | Expression starting at line 14, column 59.
    | ExtendableExpr starting at line 14, column 58.
    | Fatal errors while parsing TLA+ spec in file random_04377
    | In module random_04377
    | Could not parse module random_04377 from file random_04377.tla
    | *** Errors: 1
    | In module random_04377
    | Could not parse module random_04377 from file random_04377.tla
    3002:1 Parsing or semantic analysis failed.
---*)
