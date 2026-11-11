(*---
description: Evaluates a random function expression, seed 262, number 9026.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09026 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (([x \in 1..2 |-> x]).a < Len(<<1, 2>>)) -> [b14019 \in {b14020 \in {x \in 1..3 : x > 1} : TRUE} |-> (-1 + 2147483647)] [] OTHER -> (((1 :> 2))[1] - ([x \in Nat |-> x + 1])[0]) :> ((([x \in Nat |-> x + 1] @@ <<5, 6>>))[(-3)] + Len((<<1, 2>> \o <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09026 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
