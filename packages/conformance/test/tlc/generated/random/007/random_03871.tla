(*---
description: Evaluates a random bool expression, seed 262, number 3871.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03871 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b6094 == Head(SubSeq(<<1, 2>>, 1, 1)) IN ([<<5, 6>> EXCEPT ![b6094] = 0])[(FALSE <=> FALSE)] = (([b6095 \in {x \in 1..3 : x > 1} |-> 3] @@ (7 :> 3))).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03871 failed.
    Attempted to access tuple at a non integral index: TRUE
---*)
