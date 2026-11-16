(*---
description: Evaluates a random seq expression, seed 262, number 5417.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05417 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(<<(2 * 7), (0 - 3)>>, ((-1 \div 2) - Cardinality({1, 2}))) EXCEPT ![1] = ({([a |-> 1]).a : b8391 \in ({1, 2} \ {})} \ DOMAIN [b8392 \in {1, 2} |-> 3])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{}, -3, -2>>"
---*)
