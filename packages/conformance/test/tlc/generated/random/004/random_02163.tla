(*---
description: Evaluates a random function expression, seed 262, number 2163.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02163 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 7 ELSE 3 \div (0 \div 3)) :> ((CHOOSE r \in [a : 2..1] : TRUE)).a) @@ (([[a |-> 1] EXCEPT !.a = 2] :> (-2)) @@ ((0 - 7) :> (2 \div 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02163 failed.
    2179:0 The second argument of \div is 0.
---*)
