(*---
description: Evaluates a random function expression, seed 262, number 8591.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08591 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\E b13310 \in {2, 1} : (<<1, 2>> = (1 :> 2))) <=> ((2147483647 * 3) < IF FALSE THEN 3 ELSE 3)) => (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] = (CHOOSE r \in [a : {1, 2}] : TRUE)) <=> ((\A b13311 \in Nat : FALSE) \/ ([a |-> 1] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08591 failed.
    2178:0 Overflow when computing 2147483647*3
---*)
