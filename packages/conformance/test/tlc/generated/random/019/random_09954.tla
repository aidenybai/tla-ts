(*---
description: Evaluates a random seq expression, seed 262, number 9954.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09954 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len([SortSeq((1 :> 2), LAMBDA p, q : p < q) EXCEPT ![1] = Head(<<>>)]), LET b15480 == CASE (-1 = 7) -> Len(<<1>>) [] OTHER -> (2 * {x \in 1..3 : x > 1}) IN Cardinality({7, 2147483647})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09954 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
