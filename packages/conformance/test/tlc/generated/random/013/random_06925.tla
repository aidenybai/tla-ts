(*---
description: Evaluates a random record expression, seed 262, number 6925.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06925 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(\E b10598 \in (DOMAIN [x \in Nat |-> x + 1] \cup [<<>> EXCEPT ![1] = 2147483647]) : ((2 - 0) \in (SUBSET {1} \cup {2, 1, 3}))) EXCEPT !.a = @ + ([b10599 \in {b10600 : b10600 \in {}} |-> LET b10601 == b10599 IN b10599])[IF ([a |-> 1, b |-> TRUE] \/ FALSE) THEN (CHOOSE b10602 \in {x \in 1..3 : x > 1} : FALSE) ELSE (-1 \div 0)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 68 to line 14, col 71 of module random_06925
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06925 failed.
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    <<>>
    are not both enumerable
---*)
