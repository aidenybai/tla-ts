(*---
description: Evaluates a random seq expression, seed 262, number 7187.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07187 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(LET b11040 == CASE Append(<<1>>, 7) -> (-2) [] OTHER -> [[a |-> 1] EXCEPT !.a = 2] IN (Cardinality(1..3) % (b11040 + 3)), LET b11041 == (Cardinality({1}) % IF FALSE THEN <<1, 2>> ELSE 2147483647) IN ((-1 * [x \in Nat |-> x + 1]) * (2 \div 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07187 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 42 to line 14, col 57 of module random_07187
---*)
