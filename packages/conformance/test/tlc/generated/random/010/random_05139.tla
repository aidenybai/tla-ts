(*---
description: Evaluates a random record expression, seed 262, number 5139.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05139 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[SortSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) EXCEPT !.a = @ + Len(SelectSeq(TRUE, LAMBDA e : e > 0))] EXCEPT !.a = (CASE (0 = 1) -> (TRUE)[2147483647] [] OTHER -> IF TRUE THEN 2147483647 ELSE 2 - (CASE TRUE -> 7 [] OTHER -> 2 \div (7 * 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05139 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
