(*---
description: Evaluates a random seq expression, seed 262, number 567.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00567 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((<<(3 \div 0), LET b961 == 1 IN b961>> \o [(2 :> 7) EXCEPT ![(0 + -1)] = ([a |-> 1]).a]), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
