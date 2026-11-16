(*---
description: Evaluates a random function expression, seed 262, number 2384.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02384 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(<<>> = [x \in Nat |-> x + 1]) EXCEPT !.a = @ + Cardinality({})] EXCEPT !.a = @ + IF (FALSE = <<5, 6>>) THEN (7 \div 1) ELSE (3 % 2)] @@ [[b3781 \in {1, 0} |-> (CHOOSE b3782 \in Nat : FALSE)] EXCEPT ![((7 % 1) % Cardinality(1..3))] = LET b3783 == ([x \in Nat |-> x + 1])[-1] IN (7 .. b3783)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02384 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
