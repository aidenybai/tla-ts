(*---
description: Evaluates a random set expression, seed 262, number 8421.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08421 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Tail((<<>> \o <<>>))) .. Cardinality([[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = ([x \in Nat |-> x + 1])[2]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
