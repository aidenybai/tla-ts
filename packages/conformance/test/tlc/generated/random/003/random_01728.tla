(*---
description: Evaluates a random int expression, seed 262, number 1728.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01728 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = @ + [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]] = [a |-> (0 + [x \in Nat |-> x + 1]), b |-> (FALSE \/ TRUE)]) -> ((-Len(<<1, 2>>)) % (CHOOSE b2745 \in UNION {FALSE, 2..1} : (-1 = b2745))) [] OTHER -> Cardinality(({2 : b2746 \in 2..1} \ {1 : b2747 \in {x \in 1..3 : x > 1}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
