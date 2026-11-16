(*---
description: Evaluates a random seq expression, seed 262, number 2530.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02530 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((-(0 % 3)) - ((2147483647 + 1) % (2 + 1))), CASE (~(\A b3993 \in Nat : TRUE)) -> (IF TRUE THEN -1 ELSE 2147483647 * {0 : b3994 \in 1..3}) [] OTHER -> ([a |-> 7, b |-> FALSE]).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02530 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
