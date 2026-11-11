(*---
description: Evaluates a random int expression, seed 262, number 7446.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07446 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((3 * 2147483647) = Cardinality({x \in 1..3 : x > 1})) \/ ((-1 \in 1..3) <=> (\E b11478 \in 2..1 : FALSE))) -> CASE (\A b11479 \in (2..1 \cup {1}) : (FALSE \/ FALSE)) -> ((2147483647 + 0) % Len(<<1, 2>>)) [] OTHER -> (CASE TRUE -> 1 [] OTHER -> <<5, 6>> % LET b11480 == (1 :> 2) IN b11480) [] OTHER -> (Head(Tail(<<1>>)) * (-IF TRUE THEN 2147483647 ELSE 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07446 failed.
    2178:0 Overflow when computing 3*2147483647
---*)
