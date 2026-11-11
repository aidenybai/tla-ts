(*---
description: Evaluates a random int expression, seed 262, number 1274.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01274 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (FALSE => FALSE) THEN IF TRUE THEN 2147483647 ELSE 0 ELSE Head(<<1>>) :> CASE (\A b2031 \in Nat : FALSE) -> (CHOOSE b2032 \in {1, 2} : TRUE) [] OTHER -> (2 * 7)))[((Cardinality(2..1) % ((1 :> 2))[-1]) * ((1 + 1) - CASE TRUE -> 3 [] OTHER -> -1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01274 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 16 to line 14, col 266 of module random_01274
---*)
