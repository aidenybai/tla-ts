(*---
description: Evaluates a random function expression, seed 262, number 2288.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02288 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3610 \in {(((1 :> 2) @@ [x \in 1..2 |-> x]))[Cardinality(FALSE)] : b3611 \in {b3612 \in (Nat \ {x \in 1..3 : x > 1}) : ({1, 2} = {x \in 1..3 : x > 1})}} |-> Len(Tail(<<b3610, FALSE>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02288 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
