(*---
description: Evaluates a random seq expression, seed 262, number 3799.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03799 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(Tail([<<1>> EXCEPT ![1] = [x \in 1..2 |-> x]]), LAMBDA e : e > 0) \o (((2..1 \cap {1, 2}) \cup UNION {{1, 2}, {x \in 1..3 : x > 1}}) = {b5995 \in ({1} \ {x \in 1..3 : x > 1}) : (b5995 = b5995)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    FALSE
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    FALSE
---*)
