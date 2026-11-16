(*---
description: Evaluates a random function expression, seed 262, number 3107.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03107 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[b4961 \in 2..1 |-> 2147483647] EXCEPT ![Head(<<1, 2>>)] = Head(<<1>>)] EXCEPT ![(([a |-> 1]).a * Head(<<1, 2>>))] = Cardinality(DOMAIN [x \in Nat |-> x + 1])] EXCEPT ![Len(SelectSeq([<<1>> EXCEPT ![1] = -1], LAMBDA e : e > 0))] = Head((<<0, 2147483647>> \o <<0, 2>>))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 49 of module random_03107
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 89 of module random_03107
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 177 of module random_03107
    | <<>>
---*)
