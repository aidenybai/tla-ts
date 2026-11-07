(*---
description: Evaluates a random bool expression, seed 262, number 5843.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05843 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq(<<FALSE, -1>>, LAMBDA p, q : p < q) = [b9010 \in ({x \in 1..3 : x > 1} \cup Nat) |-> (3 % b9010)]) /\ ((\A b9011 \in DOMAIN <<5, 6>> : (1..3 \subseteq {1})) => ((TRUE => TRUE) /\ (\E b9012 \in 2..1 : FALSE)))))
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
