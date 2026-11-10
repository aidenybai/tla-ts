(*---
description: Evaluates a random int expression, seed 262, number 6358.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06358 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\A b9771 \in {b9772 \in (0 .. -1) : (TRUE => FALSE)} : (\A b9773 \in ({} \cap {}) : [<<3, 1, 2>> EXCEPT ![1] = b9773])) THEN (((7 + 0) % (-3)) + CASE (<<1>> = [x \in 1..2 |-> x]) -> (7 \div 0) [] OTHER -> Cardinality({1, 2})) ELSE Head(Append(Append(<<1, 2>>, 1), (FALSE * 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06358 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -3
---*)
