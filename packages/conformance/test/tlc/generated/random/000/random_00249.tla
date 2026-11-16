(*---
description: Evaluates a random seq expression, seed 262, number 249.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00249 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), ((1 :> 2))[1], (1 - 1))), (CHOOSE b412 \in {(<<3, 1, 2>> = [x \in 1..2 |-> x]) : b413 \in {1, 2}} : (({x \in 1..3 : x > 1} = 2..1) /\ (<<3, 1, 2>> = <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00249 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
