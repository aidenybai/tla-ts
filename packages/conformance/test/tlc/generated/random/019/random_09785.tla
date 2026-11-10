(*---
description: Evaluates a random set expression, seed 262, number 9785.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09785 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality((({} \cap SUBSET {1}) \cap {0, 7})), (Len(([a |-> 1, b |-> TRUE] \o <<1, 2>>)) * (([a |-> 1, b |-> TRUE]).a - (3 * -1)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 142 to line 14, col 142 of module random_09785 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 140.
    | Expression starting at line 14, column 140.
    | ExtendableExpr starting at line 14, column 139.
    | ExtendableExpr starting at line 14, column 111.
    | Expression starting at line 14, column 111.
    | Fatal errors while parsing TLA+ spec in file random_09785
    | In module random_09785
    | Could not parse module random_09785 from file random_09785.tla
    | *** Errors: 1
    | In module random_09785
    | Could not parse module random_09785 from file random_09785.tla
    3002:1 Parsing or semantic analysis failed.
---*)
