(*---
description: Evaluates a random set expression, seed 262, number 471.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00471 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b777 \in {(([x \in Nat |-> x + 1])[3] % (CHOOSE b778 \in {} : TRUE)), (CASE TRUE -> 2 [] OTHER -> 2147483647 + CASE TRUE -> 3 [] OTHER -> 2147483647)} : (((-b777))[Head(<<3, 1, 2>>)] \in (CHOOSE r \in [a : 2..1] : TRUE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00471 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 58 to line 14, col 82 of module random_00471
---*)
