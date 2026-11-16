(*---
description: Evaluates a random bool expression, seed 262, number 5529.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05529 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b8550 \in {Head(<<>>) : b8551 \in {b8552 \in {1} : TRUE}} : ((-b8550) \in UNION {{}, 1..3})) /\ ((~(FALSE \/ FALSE)) \/ (\A b8553 \in UNION {1..3, Nat} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05529 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
