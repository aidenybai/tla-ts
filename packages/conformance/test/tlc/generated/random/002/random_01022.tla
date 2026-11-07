(*---
description: Evaluates a random int expression, seed 262, number 1022.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01022 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE) EXCEPT ![(2 - 7)] = (7 \div 0)] EXCEPT ![([<<5, 6>> EXCEPT ![7] = 3])[Cardinality(Nat)]] = (-(-1))] EXCEPT ![CASE ((~FALSE) /\ (3 = 0)) -> Len(SortSeq(<<>>, LAMBDA p, q : p < q)) [] OTHER -> Len(SubSeq(<<1>>, 1, <<1, 2>>))] = CASE ((TRUE /\ FALSE) = [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 1]) -> (([a |-> 1, b |-> TRUE] + -1) - (-7)) [] OTHER -> (((1 :> 2))[3] - ([a |-> 1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 57 of module random_01022
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 103 to line 14, col 110 of module random_01022
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
