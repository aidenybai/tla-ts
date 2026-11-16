(*---
description: Evaluates a random int expression, seed 262, number 3389.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03389 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((\A b5383 \in UNION {{1}, {2, 1, 3}} : (1..3 < 2)) <=> ((0 \in 2..1) <=> (TRUE \/ TRUE))) -> CASE (<<7, {x \in 1..3 : x > 1}>> = [FALSE EXCEPT ![1] = 2]) -> (-(7 + 2147483647)) [] OTHER -> (IF FALSE THEN 3 ELSE 2147483647 + CASE 0 -> 1 [] OTHER -> 2147483647) [] OTHER -> LET b5384 == (-IF FALSE THEN 3 ELSE 1) IN Append(Append(<<3, 1, 2>>, 3), [a |-> [x \in Nat |-> x + 1], b |-> FALSE]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03389 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    1..3
---*)
