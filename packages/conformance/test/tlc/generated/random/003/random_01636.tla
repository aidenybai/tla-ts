(*---
description: Evaluates a random bool expression, seed 262, number 1636.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01636 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(([a |-> 1, b |-> TRUE] = [a |-> 1]) \/ (TRUE /\ FALSE))) /\ (Append(Tail(<<>>), (1 * 2)) = [b2614 \in {b2615 \in 1..3 : TRUE} |-> Len(<<>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01636 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
