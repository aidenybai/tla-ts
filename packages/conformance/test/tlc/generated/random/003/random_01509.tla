(*---
description: Evaluates a random set expression, seed 262, number 1509.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01509 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2404 \in ({Cardinality({1}) : b2405 \in ({1, 2} \cap {1})} \cap ((-1 .. 2) \cap {b2406 \in {2, 1, 3} : TRUE})) : ([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = LET b2407 == b2404 IN 3] = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = b2404] EXCEPT !.a = @ + IF [a |-> 1] THEN b2404 ELSE 7])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01509 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 267 to line 14, col 296 of module random_01509
---*)
