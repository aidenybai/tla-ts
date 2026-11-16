(*---
description: Evaluates a random function expression, seed 262, number 3131.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03131 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5002 \in {Len(SelectSeq(SUBSET {1}, LAMBDA e : e > 0)) : b5003 \in UNION {DOMAIN <<5, 6>>, ({1, 2} \cap {2, 1, 3})}} |-> (-([a |-> 3, b |-> FALSE])[Head(<<1>>)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03131 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {{}, {1}}
---*)
