(*---
description: Evaluates a random bool expression, seed 262, number 2647.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02647 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(Append(Tail(<<>>), (TRUE /\ FALSE)), (IF FALSE THEN 2 ELSE 1 + Len(<<1>>)), ((1 % -1) + (-3))) = [(CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE) EXCEPT ![Len(Tail(<<1>>))] = IF UNION {{2, 1, 3}, 2..1} THEN CASE FALSE -> 1 [] OTHER -> -1 ELSE (2147483647 - 3)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02647 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
