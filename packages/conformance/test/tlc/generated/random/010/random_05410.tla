(*---
description: Evaluates a random int expression, seed 262, number 5410.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05410 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Head((SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \o Append([a |-> 1], 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 1]
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 1]
---*)
