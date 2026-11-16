(*---
description: Evaluates a random function expression, seed 262, number 6992.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06992 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [1..2 -> {1, 2}] : TRUE) EXCEPT ![(-(Cardinality({}) * ([a |-> 1, b |-> TRUE]).a))] = LET b10708 == {[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647], CASE FALSE -> -1 [] OTHER -> 1} IN LET b10709 == (-b10708) IN ({} * {})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 53 of module random_06992
    | <<1, 1>>
---*)
