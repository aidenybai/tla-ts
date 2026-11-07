(*---
description: Evaluates a random bool expression, seed 262, number 2574.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02574 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq(Append({x \in 1..3 : x > 1}, 2), LAMBDA e : e > 0)) \in UNION {((Nat \cup {1}) \ DOMAIN [x \in Nat |-> x + 1]), {([a |-> 1, b |-> TRUE]).a : b4053 \in (0 \cap {2, 1, 3})}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {2, 3}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {2, 3}
---*)
