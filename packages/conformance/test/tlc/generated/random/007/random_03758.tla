(*---
description: Evaluates a random bool expression, seed 262, number 3758.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03758 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((FALSE => TRUE) \/ (-1 \in {x \in 1..3 : x > 1})) => (Append({1, 2}, 0) = ((1 :> 2) @@ [x \in Nat |-> x + 1]))) <=> ((\E b5925 \in ({1} \ [a |-> 1, b |-> TRUE]) : ({x \in 1..3 : x > 1} = 1..3)) \/ ({0, 2147483647} \subseteq ({} \cap {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1, 2}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1, 2}
---*)
