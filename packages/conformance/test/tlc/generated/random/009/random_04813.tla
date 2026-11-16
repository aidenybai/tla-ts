(*---
description: Evaluates a random record expression, seed 262, number 4813.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04813 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CASE (<<1, 2>> = [x \in Nat |-> x + 1]) -> (2147483647 * 2) [] OTHER -> (-1 - 3) .. LET b7503 == LET b7504 == 2147483647 IN 1 IN (-b7503)) EXCEPT !.a = (Head(SelectSeq(<<1>>, LAMBDA e : e > 0)) % (([a |-> 1] + 0) + (-1 + 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04813 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
