(*---
description: Evaluates a random bool expression, seed 262, number 7240.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07240 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [2..1 -> {1, 2}] : TRUE))[((1 :> 2))[[x \in Nat |-> x + 1]]] \div (~(\A b11129 \in Nat : (1 :> 2)))) < (((SUBSET {1} \cap SUBSET {1}) = {b11130 \in <<1>> : FALSE}) \/ ((\E b11131 \in 2..1 : TRUE) <=> (<<3, 1, 2>> = [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07240 failed.
    Attempted to check equality of integer 1 with non-integer:
    [x \in Nat |-> <expression line 14, col 85 to line 14, col 89 of module random_07240>]
---*)
