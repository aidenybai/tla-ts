(*---
description: Evaluates a random int expression, seed 262, number 797.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00797 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq(Append(7, 0), LAMBDA e : e > 0) - CASE (-1 \in {}) -> (-1 % 7) [] OTHER -> Len(<<3, 1, 2>>)) \div (((3 \div 2147483647) \div IF TRUE THEN -1 ELSE 0) % ((CHOOSE b1310 \in {2, 1, 3} : TRUE) * [b1311 \in {2, 1, 3} |-> 0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00797 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    7
---*)
