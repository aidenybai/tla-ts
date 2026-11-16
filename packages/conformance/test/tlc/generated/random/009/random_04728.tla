(*---
description: Evaluates a random bool expression, seed 262, number 4728.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04728 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({} \cup {2, 1, 3})).a /\ ((FALSE <=> FALSE) <=> (-1 < 2147483647))) => ((([x \in Nat |-> x + 1])[2147483647] * ((1 :> 2))[3]) = IF [b7394 \in Nat |-> 2147483647] THEN [b7395 \in 1..3 |-> b7395] ELSE IF TRUE THEN 1 ELSE 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04728 failed.
    Attempted to select field "a" from a non-record value {1, 2, 3}
    line 14, col 18 to line 14, col 40 of module random_04728
---*)
