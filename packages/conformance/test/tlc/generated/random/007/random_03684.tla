(*---
description: Evaluates a random seq expression, seed 262, number 3684.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03684 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SelectSeq([<<>> EXCEPT ![1] = 3], LAMBDA e : e > 0)), Cardinality({IF [a |-> 1] THEN 0 ELSE b5819 : b5819 \in (1..3 \ 1..3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 39 to line 14, col 42 of module random_03684
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03684 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
