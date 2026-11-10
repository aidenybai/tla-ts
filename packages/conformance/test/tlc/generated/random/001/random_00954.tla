(*---
description: Evaluates a random function expression, seed 262, number 954.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00954 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b1537 \in {LET b1538 == 0 IN 2, CASE TRUE -> -1 [] OTHER -> 0} |-> ((CHOOSE r \in [a : {0} \cup {1}] : TRUE))[Len(<<1, 2>>)]] EXCEPT ![(CHOOSE b1539 \in UNION {{1, -1}, UNION {{2, 1, 3}, 1..3}} : (Tail(<<>>) = (CHOOSE f \in [{1, 2} -> {}] : TRUE)))] = (((CHOOSE f \in [1..2 -> 1..2] : TRUE) @@ (CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE))).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00954 failed.
    Attempted to access record by a non-string argument: 2
---*)
