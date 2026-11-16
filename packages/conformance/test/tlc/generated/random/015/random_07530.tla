(*---
description: Evaluates a random record expression, seed 262, number 7530.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07530 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE))[((CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE))[LET b11606 == 1 IN 0]], b |-> ((([a |-> 1, b |-> TRUE]).a + Cardinality(1..3)) < ((0 * -1) % CASE FALSE -> 0 [] OTHER -> 3))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 199 to line 14, col 199 of module random_07530 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 197.
    | Expression starting at line 14, column 197.
    | ExtendableExpr starting at line 14, column 196.
    | Expression starting at line 14, column 196.
    | ExtendableExpr starting at line 14, column 195.
    | Fatal errors while parsing TLA+ spec in file random_07530
    | In module random_07530
    | Could not parse module random_07530 from file random_07530.tla
    | *** Errors: 1
    | In module random_07530
    | Could not parse module random_07530 from file random_07530.tla
    3002:1 Parsing or semantic analysis failed.
---*)
