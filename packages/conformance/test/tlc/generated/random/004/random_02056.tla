(*---
description: Evaluates a random function expression, seed 262, number 2056.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02056 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b3269 \in ({b3270 \in {} : FALSE} \ ({x \in 1..3 : x > 1} \cup {1, 2})) |-> ([[a |-> 1] EXCEPT !.a = 7]).a] EXCEPT ![LET b3271 == Len(SelectSeq(<<1>>, LAMBDA e : e > 0)) IN (Head(<<3, 1, 2>>) * Len(<<>>))] = ((CHOOSE r \in [a : 2..1] : TRUE) = [(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = (CHOOSE b3272 \in 1..3 : TRUE)])])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 124 of module random_02056
    | <<>>
---*)
