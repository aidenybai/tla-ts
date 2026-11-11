(*---
description: Evaluates a random record expression, seed 262, number 2414.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02414 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((7 * 2147483647) % (--1)), b |-> ((TRUE \/ TRUE) /\ (<<1, 2>> = [x \in 1..2 |-> x]))] EXCEPT !.a = (Cardinality((-1 .. 0)) + CASE (SUBSET {1} = {2, 1, 3}) -> (7 * 7) [] OTHER -> (3 - 3))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 47 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 44.
    | ExtendableExpr starting at line 14, column 25.
    | Expression starting at line 14, column 25.
    | ExtendableExpr starting at line 14, column 24.
    | Expression starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_02414
    | In module random_02414
    | Could not parse module random_02414 from file random_02414.tla
    | *** Errors: 1
    | In module random_02414
    | Could not parse module random_02414 from file random_02414.tla
    3002:1 Parsing or semantic analysis failed.
---*)
