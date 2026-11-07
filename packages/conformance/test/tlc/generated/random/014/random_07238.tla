(*---
description: Evaluates a random seq expression, seed 262, number 7238.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07238 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(({b11125 \in 1..3 : FALSE} \o [<<1>> EXCEPT ![1] = 7])), ((-LET b11126 == 1 IN 1) % ([b11127 \in SUBSET {1} |-> 2147483647])[(2 * 2147483647)])>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {}
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {}
---*)
