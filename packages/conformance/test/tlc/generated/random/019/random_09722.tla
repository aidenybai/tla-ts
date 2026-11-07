(*---
description: Evaluates a random int expression, seed 262, number 9722.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09722 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b15086 == ((CHOOSE b15087 \in UNION {{1, 2}, {x \in 1..3 : x > 1}} : [a |-> b15087, b |-> TRUE]) - Head(<<3, 7>>)) IN (CHOOSE b15088 \in ((b15086 .. 1) \cap {b15086, 3}) : ((~FALSE) => (\A b15089 \in SUBSET {1} : FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 32 to line 14, col 114 of module random_09722
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 32 to line 14, col 114 of module random_09722
---*)
