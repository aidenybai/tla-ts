(*---
description: Evaluates a random function expression, seed 262, number 5803.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05803 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ({3, 2} = {b8948 \in Nat : FALSE}) -> ([(1 :> 2) EXCEPT ![2147483647] = 2])[(3 % 1)] [] OTHER -> IF (2..1 \subseteq {x \in 1..3 : x > 1}) THEN Head(<<1>>) ELSE (FALSE + 1) :> (Len(Tail(<<1, 2>>)) * IF (TRUE \/ FALSE) THEN (-2147483647) ELSE (3 \in {2, 1, 3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05803 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
