(*---
description: Evaluates a random bool expression, seed 262, number 3868.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03868 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN [x \in Nat |-> x + 1] \ ({x \in 1..3 : x > 1} \ 1..3)) < IF (TRUE <=> TRUE) THEN (3 % 3) ELSE (-1 + 0)) /\ ((-(-7)) = Head((<<>> \o <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03868 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    Nat \ {}
---*)
