(*---
description: Evaluates a random record expression, seed 262, number 9010.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09010 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Cardinality({2, 0}) \div (({1, 2} = {1}))[Head(<<3, 1, 2>>)]), b |-> (\A b13996 \in (~(<<>> = [x \in 1..2 |-> x])) : (SubSeq(<<>>, 1, b13996) \subseteq {7, Nat}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09010 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 49 to line 14, col 83 of module random_09010
---*)
