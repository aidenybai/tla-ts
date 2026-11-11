(*---
description: Evaluates a random record expression, seed 262, number 5081.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05081 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + (-0)] EXCEPT !.a = ((CHOOSE b7907 \in Nat : TRUE) \div (7 * 1))] EXCEPT !.a = (Len(Tail(<<1>>)) + ((1 % 2) % ([x \in Nat |-> x + 1])[1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05081 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 101 to line 14, col 127 of module random_05081
---*)
