(*---
description: Evaluates a random int expression, seed 262, number 9420.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09420 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((-2) :> Cardinality({x \in 1..3 : x > 1})) EXCEPT ![((2 * 0) + Cardinality([x \in 1..2 |-> x]))] = Head(Append(<<3, 1, 2>>, 7))])[(-LET b14612 == IF FALSE THEN 7 ELSE 2 IN (b14612 \div 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09420 failed.
    2181:0 Attempted to compute cardinality of the value
    <<1, 2>>
---*)
