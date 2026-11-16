(*---
description: Evaluates a random set expression, seed 262, number 1106.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01106 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head((<<3, 1, 2>> \o <<1, 2>>)) \div (CHOOSE b1767 \in DOMAIN (1 :> 2) : (<<>> = [x \in Nat |-> x + 1]))) .. ((IF FALSE THEN 1 ELSE 2147483647 % (CHOOSE b1768 \in 2..1 : FALSE)) * Cardinality(DOMAIN [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01106 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
