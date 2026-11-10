(*---
description: Evaluates a random seq expression, seed 262, number 2435.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02435 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(SubSeq(Tail(<<3, 1, 2>>), Head(<<1, 2>>), IF TRUE THEN (1 :> 2) ELSE 3)), (-(-(7 + 7))), CASE {Len(<<>>), (0 * 2)} -> (([x \in Nat |-> x + 1]).a \div [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = TRUE]) [] OTHER -> ((7 :> 7))[(2147483647 - -1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02435 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<2>>
---*)
