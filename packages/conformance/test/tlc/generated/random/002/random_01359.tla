(*---
description: Evaluates a random bool expression, seed 262, number 1359.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01359 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ([b2163 \in {1} |-> b2163])[Head(<<>>)], b |-> (SubSeq(<<3, 1, 2>>, 7, 1) = (CHOOSE f \in [2..1 -> {1}] : TRUE))] = (CHOOSE r \in [a : {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01359 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
