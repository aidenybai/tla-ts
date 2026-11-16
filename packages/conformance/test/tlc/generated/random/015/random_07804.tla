(*---
description: Evaluates a random int expression, seed 262, number 7804.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07804 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<[[b12038 \in (7 .. -1) |-> (b12038 + 7)] EXCEPT ![([[a |-> 1] EXCEPT !.a = @ + 1]).a] = (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE)], ((CHOOSE f \in [2..1 -> {1, 2}] : TRUE) @@ (CASE [a |-> 1] -> 0 [] OTHER -> 2 :> (2147483647 - 7)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 57 of module random_07804
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07804 failed.
    A non-boolean expression (a record) was used as a condition of a CASE. line 14, col 207 to line 14, col 215 of module random_07804
---*)
