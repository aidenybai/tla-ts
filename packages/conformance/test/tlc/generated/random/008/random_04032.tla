(*---
description: Evaluates a random seq expression, seed 262, number 4032.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04032 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(((LET b6338 == 2 IN b6338 :> Cardinality({1})) @@ [b6339 \in {3, 7} |-> IF <<5, 6>> THEN b6339 ELSE b6339]), ([[<<5, 6>> EXCEPT ![2] = -1] EXCEPT ![IF FALSE THEN 1 ELSE 0] = CASE TRUE -> 1 [] OTHER -> 2])[Cardinality((2 .. 2))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04032 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 95 to line 14, col 127 of module random_04032
---*)
