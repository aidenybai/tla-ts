(*---
description: Evaluates a random record expression, seed 262, number 61.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00061 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (-Head(<<>>)), b |-> (~([a |-> 1] = [a |-> 1]))] EXCEPT !.a = (((<<5, 6>> @@ (1 :> 2)))[(1 \div 2)] \div ([(1 :> 2) EXCEPT ![1] = 1])[(2 + 1)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
