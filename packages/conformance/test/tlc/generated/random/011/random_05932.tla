(*---
description: Evaluates a random int expression, seed 262, number 5932.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05932 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 * 2) * CASE [x \in Nat |-> x + 1] -> 1 [] OTHER -> -1) % Head((<<3, 1, 2>> \o <<1, 2>>))) + ((CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE))[Len(SortSeq(<<1>>, LAMBDA p, q : p < q))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05932 failed.
    A non-boolean expression (a function of the form  [x \in S |-> expr]) was used as a condition of a CASE. line 14, col 34 to line 14, col 54 of module random_05932
---*)
