(*---
description: Evaluates a random bool expression, seed 262, number 491.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00491 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b806 \in {b807 \in ([a |-> 7, b |-> TRUE]).a : ((\A b808 \in {} : FALSE) /\ (\E b809 \in Nat : FALSE))} : (\E b810 \in (({1, 2} \cap {1}) \cup (1..3 \cap 1..3)) : (~({} \subseteq {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00491 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    7
    is not enumerable
---*)
