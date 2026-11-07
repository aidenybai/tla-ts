(*---
description: Evaluates a random set expression, seed 262, number 2936.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02936 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(Tail((<<>> \o <<1, 2>>))), IF LET b4648 == (7 * 2147483647) IN Len(<<1, 2>>) THEN CASE (3 \in 2..1) -> ([x \in Nat |-> x + 1])[0] [] OTHER -> ([x \in Nat |-> x + 1])[2147483647] ELSE ((CHOOSE f \in [2..1 -> {1}] : TRUE))[(-7)]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02936 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 49 to line 14, col 247 of module random_02936
---*)
