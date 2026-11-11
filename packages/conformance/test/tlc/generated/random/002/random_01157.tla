(*---
description: Evaluates a random function expression, seed 262, number 1157.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01157 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Len([<<1>> EXCEPT ![1] = 0]) :> (-LET b1854 == 2147483647 IN b1854)) EXCEPT ![LET b1855 == (IF TRUE THEN 7 ELSE 3 - (2147483647 + 2147483647)) IN ((b1855 \div b1855) + (CHOOSE b1856 \in {x \in 1..3 : x > 1} : TRUE))] = ((CASE TRUE -> [a |-> 1] [] OTHER -> 7 + (FALSE)[2]) % Head([(1 :> 2) EXCEPT ![1] = 2]))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 84 of module random_01157
    | <<-2147483647>>
---*)
