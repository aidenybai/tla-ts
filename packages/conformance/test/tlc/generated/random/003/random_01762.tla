(*---
description: Evaluates a random bool expression, seed 262, number 1762.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01762 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Append(Tail(<<3, 1, 2>>), (3 + 2147483647)) <=> (\A b2801 \in ({} \cap {}) : (b2801 \in Nat))) \/ ((([x \in 1..2 |-> x])[3] * [a |-> 0, b |-> TRUE]) = LET b2802 == (0 - 2) IN Cardinality({x \in 1..3 : x > 1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3+2147483647
    2178:0 Overflow when computing 3+2147483647
---*)
