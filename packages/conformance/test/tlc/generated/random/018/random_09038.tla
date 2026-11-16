(*---
description: Evaluates a random bool expression, seed 262, number 9038.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09038 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (IF TRUE THEN 2147483647 ELSE 2 < ([a |-> 1]).a) -> ((2 % 2147483647) + (Nat + 0)) [] OTHER -> ((CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE))[([a |-> 1, b |-> TRUE]).a] = [([b14037 \in 1..3 |-> 2] @@ [b14038 \in {1} |-> -1]) EXCEPT ![([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09038 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 23 to line 14, col 68 of module random_09038
---*)
