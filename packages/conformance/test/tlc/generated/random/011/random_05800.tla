(*---
description: Evaluates a random record expression, seed 262, number 5800.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05800 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (-(1 * 1)), b |-> (({2, 1, 3} = [a |-> 1]) /\ (FALSE /\ FALSE))] EXCEPT !.a = @ + LET b8946 == ((<<5, 6>> @@ [x \in Nat |-> x + 1]))[Head(<<3, 1, 2>>)] IN (Head(<<3, 1, 2>>) \div Len(<<>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05800 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    [a |-> 1]
---*)
