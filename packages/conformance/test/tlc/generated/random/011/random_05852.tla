(*---
description: Evaluates a random function expression, seed 262, number 5852.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05852 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9028 \in ({b9029 \in (Nat \cap Nat) : (TRUE \/ TRUE)} \ Append(Tail(<<3, 1, 2>>), Head(<<>>))) |-> Cardinality({LET b9030 == 1 IN b9028, Head(<<3, 1, 2>>)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
