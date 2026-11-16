(*---
description: Evaluates a random int expression, seed 262, number 4649.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04649 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE TRUE -> 2147483647 [] OTHER -> 3 :> (1 - 1)))[((<<5, 6>> @@ [x \in Nat |-> x + 1]))[IF TRUE THEN <<5, 6>> ELSE 0]] - Head(SelectSeq((<<1>> \o {1, 2}), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04649 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 17 to line 14, col 137 of module random_04649
---*)
