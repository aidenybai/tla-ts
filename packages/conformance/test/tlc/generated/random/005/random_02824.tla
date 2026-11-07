(*---
description: Evaluates a random function expression, seed 262, number 2824.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02824 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4488 \in {LET b4489 == Head(<<3, 1, 2>>) IN (-2), LET b4490 == (CHOOSE b4491 \in Nat : FALSE) IN (CHOOSE b4492 \in 1..3 : TRUE)} |-> IF ((2147483647 - b4488) < LET b4493 == b4488 IN b4488) THEN Cardinality(({1} \ 2..1)) ELSE IF [b4494 \in {1, 2} |-> 1] THEN IF FALSE THEN 0 ELSE b4488 ELSE (1 % 0)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647--2
    2178:0 Overflow when computing 2147483647--2
---*)
