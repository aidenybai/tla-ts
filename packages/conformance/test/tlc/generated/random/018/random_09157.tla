(*---
description: Evaluates a random set expression, seed 262, number 9157.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09157 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((IF FALSE THEN 1 ELSE 3 + Head(<<>>)) .. ([a |-> 1, b |-> TRUE]).a), {(((1 :> 2))[0] - IF FALSE THEN 7 ELSE 2), Len(SubSeq(<<3, 1, 2>>, 3, 0))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09157 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
