(*---
description: Evaluates a random seq expression, seed 262, number 2707.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02707 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Tail(Tail(SortSeq(<<1>>, LAMBDA p, q : p < q))), ((LET b4279 == 3 IN -1 - (0 % 1)) % CASE (TRUE \cap 1..3) -> (CHOOSE b4280 \in {} : FALSE) [] OTHER -> (~FALSE))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02707 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
