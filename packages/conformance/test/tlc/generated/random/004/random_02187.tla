(*---
description: Evaluates a random record expression, seed 262, number 2187.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02187 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> IF FALSE THEN -1 ELSE <<5, 6>>, b |-> ({1} = Nat)] EXCEPT !.a = @ + CASE (2147483647 \in Nat) -> Cardinality(1..3) [] OTHER -> Cardinality({2, 1, 3})] EXCEPT !.a = @ + Head([SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = CASE TRUE -> -1 [] OTHER -> 2])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02187 failed.
    Attempted to check equality of the set {1} with the value:
    Nat
---*)
