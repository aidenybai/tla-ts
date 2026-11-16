(*---
description: Evaluates a random function expression, seed 262, number 784.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00784 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 * 1) < LET b1292 == 2147483647 IN 1) \div ((1 * -1) \div (-1 \div [x \in Nat |-> x + 1]))) :> ([a |-> Head(<<3, 1, 2>>), b |-> (TRUE \/ TRUE)]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 68 to line 14, col 68 of module random_00784 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | ExtendableExpr starting at line 14, column 65.
    | Expression starting at line 14, column 65.
    | ExtendableExpr starting at line 14, column 64.
    | Fatal errors while parsing TLA+ spec in file random_00784
    | In module random_00784
    | Could not parse module random_00784 from file random_00784.tla
    | *** Errors: 1
    | In module random_00784
    | Could not parse module random_00784 from file random_00784.tla
    3002:1 Parsing or semantic analysis failed.
---*)
