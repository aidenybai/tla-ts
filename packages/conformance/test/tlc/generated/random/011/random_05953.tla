(*---
description: Evaluates a random function expression, seed 262, number 5953.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05953 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b9181 \in {LET b9182 == 3 IN b9182, (3 % 7)} |-> CASE (<<1, 2>> = <<5, 6>>) -> (-1 % 7) [] OTHER -> [[a |-> 1] EXCEPT !.a = b9181]] EXCEPT ![Head((<<-1, 7>> \o [<<>> EXCEPT ![1] = 3]))] = Cardinality((([a |-> 1]).a .. Len(<<1>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 179 to line 14, col 182 of module random_05953
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 148 of module random_05953
    | (3 :> [a |-> 3])
---*)
