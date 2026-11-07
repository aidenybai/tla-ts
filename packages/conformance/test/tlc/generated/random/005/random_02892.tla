(*---
description: Evaluates a random record expression, seed 262, number 2892.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02892 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Len(({} \o <<1, 2>>)), b |-> ((1 \div 7) \in {0, -1})] EXCEPT !.a = @ + ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] EXCEPT !.a = ((1 :> 2)).a]).a])
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
