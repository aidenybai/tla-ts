(*---
description: Evaluates a random set expression, seed 262, number 7906.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07906 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = (1 % -1)]).a, (CASE (1..3 = 1..3) -> Len(<<>>) [] OTHER -> (2147483647 - 1) - CASE (~FALSE) -> (3 % 1) [] OTHER -> (<<1, 2>> = (1 :> 2)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07906 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
