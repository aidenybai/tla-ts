(*---
description: Evaluates a random bool expression, seed 262, number 813.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00813 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(CASE <<3, 1, 2>> -> 7 [] OTHER -> <<>> \div ((1 :> 2) * 3)), IF (~TRUE) THEN (7 + 2147483647) ELSE CASE TRUE -> 7 [] OTHER -> 0} = (([<<5, 6>> EXCEPT ![<<1, 2>>] = 1])[(0 % 2..1)] \cap {b1331 \in ({x \in 1..3 : x > 1} \cap {1, 2}) : (<<1, 2>> = b1331)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00813 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 24 to line 14, col 34 of module random_00813
---*)
