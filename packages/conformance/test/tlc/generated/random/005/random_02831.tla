(*---
description: Evaluates a random int expression, seed 262, number 2831.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02831 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 % 3) - (0 \div -1)) % [[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = (-7)]) \div ([a |-> (CHOOSE b4500 \in SUBSET {1} : FALSE), b |-> (2 \in {})]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 32 to line 14, col 35 of module random_02831 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 30.
    | Expression starting at line 14, column 30.
    | ExtendableExpr starting at line 14, column 29.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | Fatal errors while parsing TLA+ spec in file random_02831
    | In module random_02831
    | Could not parse module random_02831 from file random_02831.tla
    | *** Errors: 1
    | In module random_02831
    | Could not parse module random_02831 from file random_02831.tla
    3002:1 Parsing or semantic analysis failed.
---*)
