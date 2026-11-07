(*---
description: Evaluates a random int expression, seed 262, number 8139.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08139 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Len(Tail(<<>>)) % ({b12577 : b12577 \in SUBSET {1}}).a), b |-> ([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = (2 \div 2)] = [(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + Cardinality({1, 2})])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
