(*---
description: Evaluates a random seq expression, seed 262, number 5451.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05451 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail(SubSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), Cardinality(2..1), CASE FALSE -> 3 [] OTHER -> -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05451 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
