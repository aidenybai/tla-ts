(*---
description: Evaluates a random bool expression, seed 262, number 3102.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03102 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> 2147483647, b |-> TRUE] EXCEPT !.a = Len(<<3, 1, 2>>)] EXCEPT !.a = @ + ((-1 :> 7))[(3 = 0)]] = [[[[a |-> 1] EXCEPT !.a = -1] EXCEPT !.a = @ + LET b4950 == 3 IN FALSE] EXCEPT !.a = (CHOOSE b4951 \in DOMAIN [x \in Nat |-> x + 1] : [b4952 \in SUBSET {1} |-> b4952])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03102 failed.
    Attempted to check equality of integer -1 with non-integer:
    FALSE
---*)
