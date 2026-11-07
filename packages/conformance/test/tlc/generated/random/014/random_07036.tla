(*---
description: Evaluates a random function expression, seed 262, number 7036.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07036 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Head(<<>>) \in ({2, 1, 3} \ {1, 2})) /\ ((1 < 2) \/ (\E b10791 \in {1} : b10791))) EXCEPT ![((CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE))[Len([<<3, 1, 2>> EXCEPT ![1] = 2147483647])]] = (((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE) @@ (CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE)))[([[a |-> 1] EXCEPT !.a = 2147483647]).a]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
