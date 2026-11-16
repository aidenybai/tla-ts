(*---
description: Evaluates a random bool expression, seed 262, number 537.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00537 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({CASE (<<1>> = (1 :> 2)) -> (1 % 2) [] OTHER -> ([x \in 1..2 |-> x])[2..1], Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))} \subseteq ([(7 :> 3) EXCEPT ![LET b907 == 0 IN 2] = Cardinality(2..1)] @@ [[b908 \in Nat |-> 2147483647] EXCEPT ![Head(<<>>)] = (-1 * 2)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00537 failed.
    Attempted to check if the value:
    {}
    is in the integer interval 1..2
---*)
