(*---
description: Evaluates a random function expression, seed 262, number 1375.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01375 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[b2193 \in {2 : b2194 \in {2, 1, 3}} |-> (-b2193)] EXCEPT ![(([a |-> 1]).a - (1 % 2))] = ((CHOOSE r \in [a : {}] : TRUE)).a] EXCEPT ![((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a] = Len(Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 67 of module random_01375
    | (2 :> 1)
---*)
