(*---
description: Evaluates a random seq expression, seed 262, number 9536.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09536 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(<<(3 - 2), CASE {2, 1, 3} -> 2 [] OTHER -> 2147483647>>, (([x \in 1..2 |-> x])[2] + (-1))), IF (~({1, 2} \subseteq {x \in 1..3 : x > 1})) THEN CASE (FALSE <=> TRUE) -> (1 \div 1) [] OTHER -> (-1 + 2147483647) ELSE (([x \in 1..2 |-> x] @@ (1 :> 2)) % Head(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09536 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a condition of a CASE. line 14, col 46 to line 14, col 54 of module random_09536
---*)
