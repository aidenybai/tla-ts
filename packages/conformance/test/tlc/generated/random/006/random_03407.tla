(*---
description: Evaluates a random record expression, seed 262, number 3407.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03407 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((<<3, 1, 2>> \o 2147483647) = (CHOOSE f \in [2..1 -> 2..1] : TRUE)) -> Cardinality(({1} \cap {1})) [] OTHER -> (CASE <<5, 6>> -> 2 [] OTHER -> 0 - CASE FALSE -> FALSE [] OTHER -> 2), b |-> (Head(Append(<<1>>, 2147483647)) = ((CHOOSE r \in [a : {1, 2}] : TRUE) \div (-1 + 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03407 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    2147483647
---*)
