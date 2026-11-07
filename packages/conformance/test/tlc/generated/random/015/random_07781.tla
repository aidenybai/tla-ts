(*---
description: Evaluates a random seq expression, seed 262, number 7781.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07781 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SubSeq([<<3, 1, 2>> EXCEPT ![1] = 2], (-1 \div 0), Cardinality({})) \o Tail(Tail(<<3, 1, 2>>))) \o SelectSeq(SelectSeq((<<3, 1, 2>> \o <<>>), LAMBDA e : e > 0), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
