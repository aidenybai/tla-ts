(*---
description: Evaluates a random function expression, seed 262, number 7801.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07801 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} \ {1} -> 1..2] : TRUE) EXCEPT ![Len(<<(2 * 1..3), (0 \div 0)>>)] = ([b12032 \in (-1 .. 1) |-> (CHOOSE b12033 \in Nat : FALSE)])[CASE (\A b12034 \in 2..1 : [a |-> 1]) -> SortSeq(<<1, 2>>, LAMBDA p, q : p < q) [] OTHER -> IF FALSE THEN 2 ELSE 2147483647]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07801 failed.
    2179:0 The second argument of \div is 0.
---*)
