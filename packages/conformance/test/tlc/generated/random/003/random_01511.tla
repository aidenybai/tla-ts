(*---
description: Evaluates a random seq expression, seed 262, number 1511.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01511 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([([<<5, 6>> EXCEPT ![[a |-> 1]] = 7] .. [a |-> 2147483647, b |-> TRUE]) EXCEPT ![1] = ((-2) % CASE FALSE -> 2147483647 [] OTHER -> 2)], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01511 failed.
    Attempted to access tuple at a non integral index: [a |-> 1]
---*)
