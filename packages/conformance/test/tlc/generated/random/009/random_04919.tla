(*---
description: Evaluates a random record expression, seed 262, number 4919.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04919 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> [[[a |-> 0, b |-> TRUE] EXCEPT !.a = Head(<<3, 1, 2>>)] EXCEPT !.a = @ + [(CHOOSE f \in [{1, 2} -> {1}] : TRUE) EXCEPT ![Cardinality(<<1, 2>>)] = ([x \in 1..2 |-> x])[1]]], b |-> ((-(0 * 2)) = (([a |-> 1, b |-> TRUE]).a + (0 * -1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 248 to line 14, col 248 of module random_04919 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 246.
    | Expression starting at line 14, column 246.
    | ExtendableExpr starting at line 14, column 245.
    | ExtendableExpr starting at line 14, column 217.
    | Expression starting at line 14, column 217.
    | Fatal errors while parsing TLA+ spec in file random_04919
    | In module random_04919
    | Could not parse module random_04919 from file random_04919.tla
    | *** Errors: 1
    | In module random_04919
    | Could not parse module random_04919 from file random_04919.tla
    3002:1 Parsing or semantic analysis failed.
---*)
