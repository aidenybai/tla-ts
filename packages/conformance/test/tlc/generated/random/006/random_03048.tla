(*---
description: Evaluates a random function expression, seed 262, number 3048.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03048 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4847 \in (UNION {DOMAIN [x \in 1..2 |-> x], {7, 2}} \ ({b4848 \in {1, 2} : TRUE} \cup (SUBSET {1} \cup {1}))) |-> Len([(<<1, 2>> \o <<1>>) EXCEPT ![1] = Len(<<1, 2>>)])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b4847 \\in {1, 2, 7} \\ {1, 2} \\cup {1} \\cup {{}, {1}} |-> <expression line 14, col 132 to line 14, col 185 of module random_03048>]"
---*)
