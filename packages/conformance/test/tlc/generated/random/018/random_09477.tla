(*---
description: Evaluates a random bool expression, seed 262, number 9477.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09477 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (<<>> = (1 :> 2)) THEN (1 - 3) ELSE CASE FALSE -> {2, 1, 3} [] OTHER -> 0 < ((3 - 3) % Cardinality({}))) /\ (((\E b14725 \in {1} : TRUE) <=> (~<<3, 1, 2>>)) \/ ((FALSE /\ FALSE) /\ (TRUE \/ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
