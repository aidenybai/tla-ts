(*---
description: Evaluates a random function expression, seed 262, number 1183.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01183 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b1895 \in ({b1896 \in DOMAIN [x \in 1..2 |-> x] : (<<1>> = [x \in Nat |-> x + 1])} \cap <<CASE FALSE -> 0 [] OTHER -> 1, Len([x \in 1..2 |-> x])>>) : ({Head(<<1, 2>>), (0 % -1)} = (({x \in 1..3 : x > 1} \cup {2, 1, 3}) \ (Nat \cup {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01183 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
