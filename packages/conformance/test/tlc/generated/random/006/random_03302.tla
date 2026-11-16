(*---
description: Evaluates a random int expression, seed 262, number 3302.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03302 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((0 + 7) % ([a |-> 1, b |-> TRUE]).a)) \div (Cardinality(([a |-> 1] \cup FALSE)) - CASE (3 \in {1}) -> (0 \div 2147483647) [] OTHER -> (0 * -1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 157 to line 14, col 157 of module random_03302 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 155.
    | Expression starting at line 14, column 155.
    | ExtendableExpr starting at line 14, column 154.
    | Expression starting at line 14, column 154.
    | Case Other Arm starting at line 14, column 145.
    | Fatal errors while parsing TLA+ spec in file random_03302
    | In module random_03302
    | Could not parse module random_03302 from file random_03302.tla
    | *** Errors: 1
    | In module random_03302
    | Could not parse module random_03302 from file random_03302.tla
    3002:1 Parsing or semantic analysis failed.
---*)
