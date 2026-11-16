(*---
description: Evaluates a random seq expression, seed 262, number 1979.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01979 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<((CHOOSE b3139 \in {} : {2, 1, 3}) + (-2147483647)), ((-2147483647) - (-2147483647))>> EXCEPT ![1] = ((Cardinality(Nat) * (1 - 2)) - ((1 * -1) * Len(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 156 to line 14, col 156 of module random_01979 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 154.
    | Expression starting at line 14, column 154.
    | ExtendableExpr starting at line 14, column 153.
    | Expression starting at line 14, column 153.
    | ExtendableExpr starting at line 14, column 152.
    | Fatal errors while parsing TLA+ spec in file random_01979
    | In module random_01979
    | Could not parse module random_01979 from file random_01979.tla
    | *** Errors: 1
    | In module random_01979
    | Could not parse module random_01979 from file random_01979.tla
    3002:1 Parsing or semantic analysis failed.
---*)
