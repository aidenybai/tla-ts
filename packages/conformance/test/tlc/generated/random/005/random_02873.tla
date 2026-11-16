(*---
description: Evaluates a random set expression, seed 262, number 2873.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02873 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b4553 == Cardinality((2147483647 .. 3)) IN ([a |-> b4553, b |-> TRUE]).a .. CASE (~(1 = 2)) -> ((-1) \div (3 - 2147483647)) [] OTHER -> ((7 * -1) + ((1 :> 2))[1])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 161 to line 14, col 161 of module random_02873 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 159.
    | Expression starting at line 14, column 159.
    | ExtendableExpr starting at line 14, column 158.
    | Expression starting at line 14, column 158.
    | ExtendableExpr starting at line 14, column 157.
    | Fatal errors while parsing TLA+ spec in file random_02873
    | In module random_02873
    | Could not parse module random_02873 from file random_02873.tla
    | *** Errors: 1
    | In module random_02873
    | Could not parse module random_02873 from file random_02873.tla
    3002:1 Parsing or semantic analysis failed.
---*)
