(*---
description: Evaluates a random record expression, seed 262, number 1514.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01514 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = 2] EXCEPT !.a = Len(<<1, 2>>)] EXCEPT !.a = (Cardinality(Nat) + (0 % [a |-> 1, b |-> TRUE]))] EXCEPT !.a = CASE ((3 .. 1) = {3 : b2411 \in SUBSET {1}}) -> ((-7) * (3 % [x \in 1..2 |-> x])) [] OTHER -> ((0 + 1) - (3 \div 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
