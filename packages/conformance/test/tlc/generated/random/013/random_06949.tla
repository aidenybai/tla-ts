(*---
description: Evaluates a random function expression, seed 262, number 6949.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06949 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len([<<1>> EXCEPT ![1] = 2147483647]) - Cardinality(DOMAIN [x \in Nat |-> x + 1])) :> CASE (~(CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE)) -> ((CHOOSE b10634 \in {1, 2} : FALSE) % Head(<<1>>)) [] OTHER -> (-Cardinality({1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06949 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
