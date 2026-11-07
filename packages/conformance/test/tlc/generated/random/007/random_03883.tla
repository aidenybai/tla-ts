(*---
description: Evaluates a random bool expression, seed 262, number 3883.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03883 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6116 \in ({(b6117 + 7) : b6117 \in (1..3 \cup 2..1)} \cup DOMAIN (1 @@ [x \in 1..2 |-> x])) : (((<<1, 2>> = [x \in Nat |-> x + 1]) \/ (b6116 < 2147483647)) \/ ({b6116 : b6118 \in Nat} = UNION {{}, SUBSET {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    1
    2169:0 The first argument of @@ should be a function, but instead it is:
    1
---*)
