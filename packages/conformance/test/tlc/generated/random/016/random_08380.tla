(*---
description: Evaluates a random record expression, seed 262, number 8380.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08380 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] EXCEPT !.a = (2 * -1)] EXCEPT !.a = @ + Cardinality(({1, 2} \cup {1}))] EXCEPT !.a = @ + [[a |-> (2 - 1), b |-> ({x \in 1..3 : x > 1} = 2..1)] EXCEPT !.a = ([<<5, 6>> EXCEPT ![2147483647] = 0])[(2147483647 \div 7)]]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 78 to line 14, col 78 of module random_08380 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 76.
    | ExtendableExpr starting at line 14, column 75.
    | Expression starting at line 14, column 75.
    | Except Spec starting at line 14, column 69.
    | Fatal errors while parsing TLA+ spec in file random_08380
    | In module random_08380
    | Could not parse module random_08380 from file random_08380.tla
    | *** Errors: 1
    | In module random_08380
    | Could not parse module random_08380 from file random_08380.tla
    3002:1 Parsing or semantic analysis failed.
---*)
