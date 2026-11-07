(*---
description: Evaluates a random bool expression, seed 262, number 6997.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06997 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(\E b10717 \in (1..3 \cup {x \in 1..3 : x > 1}) : (b10717 < FALSE))) <=> (((2147483647 % 7) < (CHOOSE b10718 \in 1..3 : FALSE)) /\ (\A b10719 \in {b10720 : b10720 \in [x \in Nat |-> x + 1]} : (2 = 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    FALSE
    2266:0 The second argument of < should be an integer, but instead it is:
    FALSE
---*)
