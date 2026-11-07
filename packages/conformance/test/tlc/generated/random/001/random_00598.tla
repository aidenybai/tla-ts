(*---
description: Evaluates a random function expression, seed 262, number 598.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00598 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b1003 \in {Len((<<>> \o [a |-> 1])), CASE ({1} = <<5, 6>>) -> ([a |-> 1, b |-> TRUE] * 7) [] OTHER -> Head(<<3, 1, 2>>)} : (LET b1004 == (b1003 \div 1) IN Cardinality({1}) < (-Head(<<3, 1, 2>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 1]
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 1]
---*)
