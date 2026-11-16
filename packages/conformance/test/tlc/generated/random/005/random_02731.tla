(*---
description: Evaluates a random seq expression, seed 262, number 2731.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02731 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SortSeq([<<3, 1, 2>> EXCEPT ![1] = 2], LAMBDA p, q : p < q) \o Append(SubSeq(<<3, 1, 2>>, 1, 0), Len(<<1>>))), (Head(Tail(<<>>)) = (-(CHOOSE b4312 \in 2..1 : FALSE))), Head([({x \in 1..3 : x > 1} \cap 1..3) EXCEPT ![1] = LET b4313 == 1 IN b4313])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02731 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
