(*---
description: Evaluates a random bool expression, seed 262, number 5479.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05479 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = 1] EXCEPT !.a = (7 % 1)] EXCEPT !.a = @ + (Cardinality({2, 1, 3}) * ([a |-> 1, b |-> TRUE]).a)] = [a |-> Head([<<>> EXCEPT ![1] = 3]), b |-> (Head(<<>>) \in DOMAIN (1 :> 2))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 154 to line 14, col 157 of module random_05479
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
