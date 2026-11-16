(*---
description: Evaluates a random set expression, seed 262, number 3764.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03764 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Cardinality({1, 2}) % Head(<<3, 1, 2>>)) : b5933 \in {Cardinality({1}), IF FALSE THEN 2 ELSE 0}} \ DOMAIN [(CHOOSE f \in [{} -> 1..2] : TRUE) EXCEPT ![([a |-> 1]).a] = (1 \div 7)]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 127 to line 14, col 158 of module random_03764
    | {2}
---*)
