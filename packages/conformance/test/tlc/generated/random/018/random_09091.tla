(*---
description: Evaluates a random set expression, seed 262, number 9091.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09091 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2..1 \cup <<>>) \cup {b14124 \in {x \in 1..3 : x > 1} : FALSE}) \ DOMAIN [(1 :> 2) EXCEPT ![7] = 7]) \cup DOMAIN (Cardinality(Nat) :> Len(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 95 to line 14, col 100 of module random_09091
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09091 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
