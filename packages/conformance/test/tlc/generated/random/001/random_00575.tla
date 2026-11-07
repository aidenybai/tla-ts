(*---
description: Evaluates a random bool expression, seed 262, number 575.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00575 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq(SelectSeq({1}, LAMBDA e : e > 0), LAMBDA e : e > 0)) \in UNION {{b973 \in ({2, 1, 3} \cup {2, 1, 3}) : (TRUE \/ FALSE)}, (UNION {{1, 2}, 2..1} \cup (3 .. -1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {1}
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {1}
---*)
