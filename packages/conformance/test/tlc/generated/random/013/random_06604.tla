(*---
description: Evaluates a random seq expression, seed 262, number 6604.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06604 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b10133 \in (({1} \cap {}) \cup (2..1 \ SUBSET {1})) : (([a |-> 1] = [a |-> 1]) /\ ({x \in 1..3 : x > 1} \subseteq {2, 1, 3}))) \o SelectSeq([[<<1, 2>> EXCEPT ![1] = 2147483647] EXCEPT ![1] = (-1 \div 2147483647)], LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    TRUE
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    TRUE
---*)
