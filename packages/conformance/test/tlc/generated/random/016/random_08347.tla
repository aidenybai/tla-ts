(*---
description: Evaluates a random set expression, seed 262, number 8347.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08347 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b12912 == CASE (~TRUE) -> IF TRUE THEN 3 ELSE 2 [] OTHER -> IF FALSE THEN -1 ELSE 3 IN (Head(<<>>) % (2147483647 * 1)), LET b12913 == Head(Append(<<1, 2>>, 3)) IN (CASE TRUE -> -1 [] OTHER -> -1 - CASE TRUE -> b12913 [] OTHER -> b12913)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08347 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
