(*---
description: Evaluates a random seq expression, seed 262, number 9279.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09279 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq(SortSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA p, q : p < q), ((3 :> 1))[Head(<<>>)], (CHOOSE b14405 \in UNION {Nat, {1}} : (\A b14406 \in {1} : TRUE))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09279 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
