(*---
description: Evaluates a random seq expression, seed 262, number 2150.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02150 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(<<Len(<<1>>), CASE FALSE -> -1 [] OTHER -> 7>>, LAMBDA e : e > 0) \o ([a |-> Head(<<3, 1, 2>>), b |-> (FALSE /\ FALSE)] \cap ((-1 .. -1) \cap {b3398 : b3398 \in {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {}
---*)
