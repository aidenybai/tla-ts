(*---
description: Evaluates a random record expression, seed 262, number 4428.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04428 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((7 % 2) .. (0 \div -1)) -> Len(Tail(<<1, 2>>)) [] OTHER -> ([b6967 \in {1, 2} |-> 7])[((1 :> 2))[7]], b |-> (((2147483647 * 7) % (2 * 3)) < (-(3 + 7)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 43 to line 14, col 46 of module random_04428 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 41.
    | Expression starting at line 14, column 41.
    | ExtendableExpr starting at line 14, column 40.
    | ExtendableExpr starting at line 14, column 29.
    | Expression starting at line 14, column 29.
    | Fatal errors while parsing TLA+ spec in file random_04428
    | In module random_04428
    | Could not parse module random_04428 from file random_04428.tla
    | *** Errors: 1
    | In module random_04428
    | Could not parse module random_04428 from file random_04428.tla
    3002:1 Parsing or semantic analysis failed.
---*)
