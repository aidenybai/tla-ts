(*---
description: Evaluates a random int expression, seed 262, number 8635.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08635 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (<<1, 2>> = [x \in 1..2 |-> x]) THEN IF FALSE THEN -1 ELSE 1 ELSE (2 - 1) :> (IF FALSE THEN 3 ELSE 7 * (CHOOSE b13370 \in <<1, 2>> : TRUE))))[(Len(Tail(<<1, 2>>)) % (-Len(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08635 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 16 to line 14, col 203 of module random_08635
---*)
