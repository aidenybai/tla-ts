(*---
description: Evaluates a random int expression, seed 262, number 3313.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03313 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ([[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = Head(<<1, 2>>)] = (([x \in 1..2 |-> x] @@ <<5, 6>>))[LET b5264 == 7 IN b5264]) -> ((IF TRUE THEN -1 ELSE 7 :> (-3))).a [] OTHER -> ((-IF FALSE THEN 7 ELSE 2) \div Len([<<1>> EXCEPT ![1] = 3])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03313 failed.
    Attempted to apply function:
    <<1, 2>>
    to argument 7, which is not in the domain of the function.
---*)
