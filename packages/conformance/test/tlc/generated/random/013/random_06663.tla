(*---
description: Evaluates a random bool expression, seed 262, number 6663.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06663 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((FALSE \/ FALSE) \/ (1..3 = [x \in 1..2 |-> x])) /\ (~(2..1 \subseteq 2..1))) \/ (\E b10220 \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) : ((\E b10221 \in {1} : FALSE) \/ {b10220, 2147483647}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06663 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    <<1, 2>>
---*)
