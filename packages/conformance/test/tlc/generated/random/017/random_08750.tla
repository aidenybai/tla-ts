(*---
description: Evaluates a random bool expression, seed 262, number 8750.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08750 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((UNION {{2, 1, 3}, {1}} \cup {b13548 : b13548 \in {1}}) \cap {CASE 7 -> -1 [] OTHER -> 2147483647, (3 * 3)}), ((([a |-> 1]).a .. (-1 % 2)) \ UNION {{b13549 \in {1, 2} : FALSE}, {b13550 : b13550 \in Nat}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08750 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. 7
---*)
