(*---
description: Evaluates a random int expression, seed 262, number 6320.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06320 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([Tail([<<>> EXCEPT ![1] = 2]) EXCEPT ![1] = UNION {(<<1>> \o <<>>), {b9713 \in {2, 1, 3} : TRUE}}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 27 to line 14, col 30 of module random_06320
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06320 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
