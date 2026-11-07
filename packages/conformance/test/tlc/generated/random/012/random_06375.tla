(*---
description: Evaluates a random int expression, seed 262, number 6375.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06375 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b9799 \in {Cardinality(Nat) : b9800 \in (2..1 \cup 1..3)} : (~UNION {[x \in 1..2 |-> x], 1..3})) \div (Tail((2147483647 .. 0)) \o (Tail(FALSE) \o [<<1, 2>> EXCEPT ![1] = 3]))))
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
