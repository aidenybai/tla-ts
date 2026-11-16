(*---
description: Evaluates a random function expression, seed 262, number 6597.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06597 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[<<5, 6>> EXCEPT ![2] = 1] EXCEPT ![(-1 % 3)] = (3 + 1)] EXCEPT ![IF [a |-> 1, b |-> TRUE] THEN CASE TRUE -> 1 [] OTHER -> 2 ELSE (<<1, 2>> \o <<1>>)] = Head(Tail(<<1>>))] @@ (CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06597 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 85 to line 14, col 167 of module random_06597
---*)
