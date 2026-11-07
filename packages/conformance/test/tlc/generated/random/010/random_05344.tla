(*---
description: Evaluates a random int expression, seed 262, number 5344.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05344 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({1}) \div (2147483647 * 2)) % CASE [[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] -> [[a |-> 1] EXCEPT !.a = 7] [] OTHER -> [[a |-> 1] EXCEPT !.a = @ + Nat]) + Cardinality(((7 % 3) .. (CHOOSE b8259 \in {2, 1, 3} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*2
    2178:0 Overflow when computing 2147483647*2
---*)
