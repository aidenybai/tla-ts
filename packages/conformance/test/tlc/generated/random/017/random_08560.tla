(*---
description: Evaluates a random seq expression, seed 262, number 8560.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08560 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([SubSeq(Tail(<<>>), (2 % 2147483647), [a |-> 2, b |-> FALSE]) EXCEPT ![1] = CASE (0 < 1) -> (-1 - 1) [] OTHER -> LET b13260 == 7 IN b13260], (-(CHOOSE b13261 \in {b13262 : b13262 \in SUBSET {1}} : Tail(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08560 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
