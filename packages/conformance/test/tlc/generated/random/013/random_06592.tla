(*---
description: Evaluates a random bool expression, seed 262, number 6592.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06592 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-3) \div Head(<<3, 1, 2>>)) .. ((2).a = (3 \in {}))) \subseteq (Cardinality((0 .. 2..1)) + (CHOOSE b10117 \in {3, 3} : (3 \in {1})))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops .. in block line 14, col 99 to line 14, col 100 of module random_06592 and ...
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 102.
    | ExtendableExpr starting at line 14, column 97.
    | Expression starting at line 14, column 97.
    | ExtendableExpr starting at line 14, column 96.
    | Expression starting at line 14, column 96.
    | Fatal errors while parsing TLA+ spec in file random_06592
    | In module random_06592
    | Could not parse module random_06592 from file random_06592.tla
    | *** Errors: 1
    | In module random_06592
    | Could not parse module random_06592 from file random_06592.tla
    3002:1 Parsing or semantic analysis failed.
---*)
