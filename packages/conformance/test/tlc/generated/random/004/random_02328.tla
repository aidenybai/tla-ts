(*---
description: Evaluates a random bool expression, seed 262, number 2328.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02328 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((7 < 1) \in {7, 0}) EXCEPT !.a = @ + ((-2147483647) - ({2, 1, 3} \cap Nat))] = [(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = ([a |-> 2, b |-> [a |-> 1]]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02328 failed.
    Attempted to check equality of integer 7 with non-integer:
    FALSE
---*)
