(*---
description: Evaluates a random int expression, seed 262, number 938.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00938 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(<<(([x \in 1..2 |-> x])[3] + (1 \div -1)), (CHOOSE b1500 \in {FALSE : b1501 \in {}} : (Nat = SUBSET {1}))>>))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 53 to line 14, col 56 of module random_00938 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 51.
    | Expression starting at line 14, column 51.
    | ExtendableExpr starting at line 14, column 50.
    | ExtendableExpr starting at line 14, column 24.
    | Expression starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_00938
    | In module random_00938
    | Could not parse module random_00938 from file random_00938.tla
    | *** Errors: 1
    | In module random_00938
    | Could not parse module random_00938 from file random_00938.tla
    3002:1 Parsing or semantic analysis failed.
---*)
