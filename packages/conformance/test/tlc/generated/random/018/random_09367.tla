(*---
description: Evaluates a random int expression, seed 262, number 9367.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09367 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b14540 \in [[[[x \in 1..2 |-> x] EXCEPT ![2147483647] = -1] EXCEPT ![(2147483647 + 3)] = ([a |-> 1]).a] EXCEPT ![Head(Append(<<1, 2>>, 3))] = Head(SelectSeq(<<>>, LAMBDA e : e > 0))] : (((<<>> \div 0) * IF FALSE THEN 2147483647 ELSE b14540) = (IF TRUE THEN 2 ELSE 3 \div (0 + 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 38 to line 14, col 55 of module random_09367
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09367 failed.
    2178:0 Overflow when computing 2147483647+3
---*)
