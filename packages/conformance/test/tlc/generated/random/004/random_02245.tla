(*---
description: Evaluates a random set expression, seed 262, number 2245.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02245 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (((-7) * Head(<<>>)) :> Len(SubSeq(<<3, 1, 2>>, TRUE, 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02245 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
