(*---
description: Evaluates a random function expression, seed 262, number 314.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00314 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b522 \in (((<<1, 2>> \o <<1, 2>>)).a .. ((2 :> 3))[((1 :> 2))[2147483647]]) |-> Len(Append(<<3, 7>>, Cardinality({1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00314 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
