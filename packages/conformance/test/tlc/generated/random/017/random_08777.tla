(*---
description: Evaluates a random function expression, seed 262, number 8777.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08777 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[x \in 1..2 |-> x] EXCEPT ![2147483647] = 7] EXCEPT ![IF FALSE THEN 3 ELSE 7] = ([a |-> 1, b |-> TRUE]).a] EXCEPT ![Head(<<2, 2147483647>>)] = (-(-0))] EXCEPT ![(CHOOSE b13591 \in [[(1 :> 2) EXCEPT ![2] = 7] EXCEPT ![IF FALSE THEN 1 ELSE 3] = CASE TRUE -> 3 [] OTHER -> 3] : ((~FALSE) => ({1, 2} = {2, 1, 3})))] = (-Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 37 of module random_08777
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 63 of module random_08777
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 203 to line 14, col 208 of module random_08777
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 201 to line 14, col 226 of module random_08777
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08777 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 182 to line 14, col 328 of module random_08777
---*)
