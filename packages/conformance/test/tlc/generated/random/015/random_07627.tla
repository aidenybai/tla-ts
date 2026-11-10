(*---
description: Evaluates a random function expression, seed 262, number 7627.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07627 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b11733 \in {(0 + 2147483647) : b11734 \in (Nat \ {})} : ((3 * b11733) < Len(<<1, 2>>))) :> Len(Tail([<<3, 1, 2>> EXCEPT ![1] = 0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07627 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
