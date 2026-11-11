(*---
description: Evaluates a random record expression, seed 262, number 8208.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08208 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([((1 :> 2) @@ <<5, 6>>) EXCEPT !.a = @ + Len(<<1>>)]).a, b |-> (((-1 + 7) = (1 % 2)) /\ ([b12705 \in 2 |-> {x \in 1..3 : x > 1}] @@ [[x \in 1..2 |-> x] EXCEPT ![7] = 3]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08208 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
