(*---
description: Evaluates a random function expression, seed 262, number 1137.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01137 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1819 \in (((3 < 3) \/ ([a |-> 1, b |-> TRUE] \/ FALSE)) <=> ((CHOOSE r \in [a : {1, 2}] : TRUE) = [a |-> 7, b |-> TRUE])) |-> Len(SubSeq(Append(<<1, 2>>, b1819), (1 % 1), LET b1820 == -1 IN 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01137 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a record.
    line 14, col 41 to line 14, col 70 of module random_01137
---*)
