(*---
description: Evaluates a random set expression, seed 262, number 3406.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03406 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SelectSeq(({1, 2} \subseteq 2..1), LAMBDA e : e > 0)) : b5409 \in {Head([<<3, 1, 2>> EXCEPT ![1] = 7]), ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    FALSE
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    FALSE
---*)
