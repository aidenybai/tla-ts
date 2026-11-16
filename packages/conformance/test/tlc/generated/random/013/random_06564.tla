(*---
description: Evaluates a random int expression, seed 262, number 6564.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06564 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (CASE TRUE -> 7 [] OTHER -> 2147483647 - (2147483647 * -1)), b |-> ((2147483647 \div 3) \in ({2, 1, 3} \ SUBSET {1}))]).a)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 77 to line 14, col 77 of module random_06564 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | ExtendableExpr starting at line 14, column 65.
    | ExtendableExpr starting at line 14, column 52.
    | Expression starting at line 14, column 52.
    | Fatal errors while parsing TLA+ spec in file random_06564
    | In module random_06564
    | Could not parse module random_06564 from file random_06564.tla
    | *** Errors: 1
    | In module random_06564
    | Could not parse module random_06564 from file random_06564.tla
    3002:1 Parsing or semantic analysis failed.
---*)
