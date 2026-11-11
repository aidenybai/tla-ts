(*---
description: Evaluates a random int expression, seed 262, number 8974.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08974 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((2147483647 :> 1) = {b13926 \in {x \in 1..3 : x > 1} : <<5, 6>>}) THEN Cardinality({-1, 7}) ELSE Cardinality({b13927 \in Nat : FALSE}) + Head(Tail(<<-1, 1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08974 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a tuple.
    line 14, col 76 to line 14, col 83 of module random_08974
---*)
