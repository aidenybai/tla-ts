(*---
description: Evaluates a random function expression, seed 262, number 9999.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09999 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(Head(<<1>>) :> ([a |-> 1, b |-> TRUE]).a) EXCEPT ![([[x \in 1..2 |-> x] EXCEPT !.a = 3]).a] = ((-1 \div 2147483647) - (1 :> 7))] @@ [b15548 \in (([a |-> 1]).a .. ([a |-> 1, b |-> TRUE]).a) |-> ((2 :> <<1, 2>>))[UNION {{x \in 1..3 : x > 1}, {}}]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09999 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
