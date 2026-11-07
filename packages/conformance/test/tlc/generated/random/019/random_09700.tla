(*---
description: Evaluates a random bool expression, seed 262, number 9700.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09700 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b15048 \in {((3 \div 1) \div Len(<<1, 2>>)), Cardinality((7 < 3))} : ((\E b15049 \in (b15048 .. b15048) : (\A b15050 \in SUBSET {1} : TRUE)) /\ ([[a |-> 1, b |-> TRUE] EXCEPT !.a = b15048] = [a |-> 2147483647, b |-> FALSE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    FALSE
    2181:0 Attempted to compute cardinality of the value
    FALSE
---*)
