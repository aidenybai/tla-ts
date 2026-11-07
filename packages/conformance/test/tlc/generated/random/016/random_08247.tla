(*---
description: Evaluates a random record expression, seed 262, number 8247.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08247 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + CASE FALSE -> 2147483647 [] OTHER -> 7] EXCEPT !.a = @ + ((2 \div 2) + Cardinality(Nat))] EXCEPT !.a = (((CHOOSE r \in [a : {}] : TRUE)).a * (-([a |-> 1, b |-> TRUE]).a))])
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
