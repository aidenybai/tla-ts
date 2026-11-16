(*---
description: Evaluates a random bool expression, seed 262, number 4483.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04483 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~(-1 = [a |-> 1])) /\ ([<<>> EXCEPT ![1] = 2] \/ (<<1, 2>> = [x \in 1..2 |-> x]))) => (((<<1>> = [x \in 1..2 |-> x]) /\ (\E b7049 \in 2..1 : FALSE)) \/ SelectSeq((<<>> \o <<>>), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04483 failed.
    Attempted to check equality of integer -1 with non-integer:
    [a |-> 1]
---*)
