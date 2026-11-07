(*---
description: Evaluates a random set expression, seed 262, number 871.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00871 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality(((0 .. -1) \cup ({x \in 1..3 : x > 1} \ {1, 2}))), Head(({b1412 : b1412 \in {1}} \o Append(<<3, 1, 2>>, -1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {1}
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {1}
---*)
