(*---
description: Evaluates a random int expression, seed 262, number 2900.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02900 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((7 :> 3))[((1 :> 2))[0]], LET b4593 == ([a |-> 1]).a IN [[x \in 1..2 |-> x] EXCEPT ![-1] = 3]} \div CASE (({x \in 1..3 : x > 1} \subseteq {1}) \/ (~TRUE)) -> Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) [] OTHER -> IF (~FALSE) THEN (<<5, 6>>)[3] ELSE CASE 2..1 -> 2 [] OTHER -> 3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02900 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
