(*---
description: Evaluates a random record expression, seed 262, number 3718.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03718 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([CASE ((TRUE \/ FALSE) => (FALSE /\ <<5, 6>>)) -> (-Len(<<3, 1, 2>>)) [] OTHER -> ((2147483647 - 2) * CASE TRUE -> 2 [] OTHER -> 3) EXCEPT !.a = @ + CASE (\E b5875 \in (1..3 \cap [a |-> 1]) : (TRUE /\ FALSE)) -> ((2147483647 % 0) + LET b5876 == 7 IN 7) [] OTHER -> (Len(TRUE) - ([a |-> 1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483645*2
    2178:0 Overflow when computing 2147483645*2
---*)
