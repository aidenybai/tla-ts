(*---
description: Evaluates a random int expression, seed 262, number 7565.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07565 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + (3 + 7)] = [[[a |-> 1] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + (1 * 7)]) -> LET b11647 == ([[x \in Nat |-> x + 1] EXCEPT ![0] = 3])[(-1 * 2)] IN ([[x \in Nat |-> x + 1] EXCEPT !.a = SUBSET {1}]).a [] OTHER -> Cardinality(UNION {(SUBSET {1} \cap 2..1), ((1 :> 2) \ {1})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
