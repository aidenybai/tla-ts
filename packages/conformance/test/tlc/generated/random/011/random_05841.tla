(*---
description: Evaluates a random function expression, seed 262, number 5841.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05841 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9005 \in (((0 * 2) % (CHOOSE b9006 \in 1..3 : TRUE)) .. IF [a |-> 1, b |-> FALSE] THEN ({2, 1, 3})[7] ELSE LET b9007 == 3 IN 1) |-> (-Head(SubSeq(<<1, 2>>, FALSE, 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05841 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 74 to line 14, col 143 of module random_05841
---*)
