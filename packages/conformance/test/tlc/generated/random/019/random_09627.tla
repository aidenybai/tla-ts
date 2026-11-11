(*---
description: Evaluates a random function expression, seed 262, number 9627.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09627 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE 7 -> 2147483647 [] OTHER -> 3 % CASE TRUE -> 7 [] OTHER -> -1) % (CHOOSE b14948 \in (2 .. 7) : (\A b14949 \in {2, 1, 3} : FALSE))) :> (IF (Nat \subseteq {}) THEN Len(<<3, 1, 2>>) ELSE (2 \div 1) + (([x \in Nat |-> x + 1] @@ <<5, 6>>))[([x \in Nat |-> x + 1])[0]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09627 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. 7
---*)
