(*---
description: Evaluates a random record expression, seed 262, number 846.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00846 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b1382 \in (({} \cap {2, 1, 3}) \ {b1383 \in {2, 1, 3} : b1383}) : (\E b1384 \in (b1382 .. 2147483647) : (~FALSE))) .. ([[b1385 \in {} |-> 3] EXCEPT ![Head(<<1>>)] = (2 * 3)])[((3 \div <<1, 2>>) % Len(<<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00846 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 14, col 81 to line 14, col 85 of module random_00846
---*)
