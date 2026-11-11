(*---
description: Evaluates a random bool expression, seed 262, number 7573.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07573 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b11653 \in ({Cardinality({x \in 1..3 : x > 1}), CASE FALSE -> 7 [] OTHER -> FALSE} \cap DOMAIN [<<5, 6>> EXCEPT ![0] = -1]) : (((Nat \ {1, 2}) = {b11654 \in 1..3 : [a |-> 1]}) \/ (\E b11655 \in DOMAIN (1 :> 2) : (TRUE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 116 to line 14, col 123 of module random_07573
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07573 failed.
    Attempted to check if the value:
    FALSE
    is in the integer interval 1..2
---*)
