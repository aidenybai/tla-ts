(*---
description: Evaluates a random int expression, seed 262, number 428.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00428 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b697 == LET b698 == ((-1 - 2147483647) \div IF FALSE THEN 3 ELSE 1) IN (-Cardinality(SUBSET {1})) IN (-CASE LET b699 == b697 IN 2147483647 -> (-FALSE) [] OTHER -> ([a |-> 1]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00428 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 128 to line 14, col 157 of module random_00428
---*)
