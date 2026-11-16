(*---
description: Evaluates a random int expression, seed 262, number 6551.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06551 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE DOMAIN ((7 :> 3) @@ (7 :> 2147483647)) -> Cardinality((IF FALSE THEN 2147483647 ELSE 7 .. (7 - [x \in 1..2 |-> x]))) [] OTHER -> ((-Head(<<1>>)) \div ([(1 :> 2) EXCEPT ![1] = -1])[Head(<<1>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06551 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a condition of a CASE. line 14, col 21 to line 14, col 58 of module random_06551
---*)
