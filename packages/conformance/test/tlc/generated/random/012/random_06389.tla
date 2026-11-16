(*---
description: Evaluates a random record expression, seed 262, number 6389.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06389 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 2147483647, b |-> TRUE] EXCEPT !.a = Head(<<3, 1, 2>>)] EXCEPT !.a = @ + IF (\E b9822 \in {2, 1, 3} : FALSE) THEN (7)[0] ELSE LET b9823 == 1 IN b9823] EXCEPT !.a = @ + (CHOOSE b9824 \in {(CHOOSE b9825 \in [x \in Nat |-> x + 1] : [a |-> 1, b |-> TRUE]), (3 % 3)} : ((0 \div b9824) \in UNION {2..1, {}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06389 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 214 to line 14, col 275 of module random_06389
---*)
