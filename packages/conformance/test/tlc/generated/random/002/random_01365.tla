(*---
description: Evaluates a random record expression, seed 262, number 1365.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01365 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head([<<>> EXCEPT ![1] = 2147483647]), b |-> ((2..1 \ SUBSET {1}) = DOMAIN [x \in 1..2 |-> x])] EXCEPT !.a = (((CHOOSE f \in [2..1 -> 2..1] : TRUE))[CASE FALSE -> 1 [] OTHER -> 3] - Head(Tail(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 30 to line 14, col 33 of module random_01365
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01365 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
