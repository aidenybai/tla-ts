(*---
description: Evaluates a random function expression, seed 262, number 3264.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03264 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5196 \in UNION {((2 .. 7) \cup (SUBSET {1} \cap Nat)), {([a |-> 1, b |-> TRUE]).a : b5197 \in {b5198 \in {1} : FALSE}}} |-> [[[(1 :> 2) EXCEPT ![2] = b5196] EXCEPT ![Len(<<>>)] = Cardinality(Nat)] EXCEPT ![([b5199 \in {x \in 1..3 : x > 1} |-> b5199])[(b5196 % 2)]] = Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)
