(*---
description: Evaluates a random int expression, seed 262, number 9923.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09923 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![<<5, 6>>] = 2147483647] \ {b15437 \in UNION {{1}, {}} : (3 < b15437)}), {Head(<<2, 2>>) : b15438 \in (Head(<<>>) \ (-1 .. -1))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    <<5, 6>>
    is an element of Nat.
    2158:0 Attempted to check if the value:
    <<5, 6>>
    is an element of Nat.
---*)
