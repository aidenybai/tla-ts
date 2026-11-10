(*---
description: Evaluates a random int expression, seed 262, number 5514.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05514 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b8521 \in {([[a |-> 1] EXCEPT !.a = @ + 7]).a, LET b8522 == Head(<<1>>) IN ([x \in Nat |-> x + 1])[2147483647]} : ((CHOOSE b8523 \in UNION {{1}, {}} : (FALSE => TRUE)) = (Head(<<1, 2>>) * (CHOOSE b8524 \in 1..3 : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05514 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
