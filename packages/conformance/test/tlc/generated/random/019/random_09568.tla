(*---
description: Evaluates a random int expression, seed 262, number 9568.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09568 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b14855 \in (({1, 2} \cup {x \in 1..3 : x > 1}) \cap DOMAIN [x \in Nat |-> x + 1]) |-> Len(<<2147483647, b14855>>)])[(([<<>> EXCEPT ![1] = 1] @@ (1 :> 2)))[(CHOOSE b14856 \in UNION {Nat, 1..3} : (TRUE /\ FALSE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 137 to line 14, col 140 of module random_09568
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09568 failed.
    Attempted to compare the set {1, 2, 3} with the value:
    Nat
---*)
