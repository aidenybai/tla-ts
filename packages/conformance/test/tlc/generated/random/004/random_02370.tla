(*---
description: Evaluates a random set expression, seed 262, number 2370.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02370 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(LET b3752 == 7 IN b3752 * CASE 1 -> 7 [] OTHER -> 0), Cardinality((1..3 \cup {}))} \ UNION {(CASE TRUE -> 1 [] OTHER -> 7 .. IF FALSE THEN 2147483647 ELSE 1), {b3753 \in (Nat \ {x \in 1..3 : x > 1}) : (<<1, 2>> = [x \in 1..2 |-> x])}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02370 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. 1
---*)
