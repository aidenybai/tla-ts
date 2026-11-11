(*---
description: Evaluates a random function expression, seed 262, number 9348.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09348 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b14506 \in DOMAIN (0 :> FALSE) |-> Cardinality({b14507 \in {2, 1, 3} : TRUE})] EXCEPT ![((Head(<<>>) + Len(<<1>>)) % LET b14508 == (-2147483647) IN (0 + 7))] = ((Head([a |-> 1, b |-> TRUE]) \div (CHOOSE b14509 \in {} : FALSE)) \div ((0 % 2147483647) * ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09348 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
