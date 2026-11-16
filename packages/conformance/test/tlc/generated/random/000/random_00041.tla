(*---
description: Evaluates a random record expression, seed 262, number 41.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00041 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Cardinality(UNION {{x \in 1..3 : x > 1}, {}}) \in ({7, SUBSET {1}} \cap UNION {SUBSET {1}, {x \in 1..3 : x > 1}})) EXCEPT !.a = @ + LET b61 == LET b62 == CASE FALSE -> 7 [] OTHER -> 1 IN Len(<<1, 2>>) IN (CASE FALSE -> 2 [] OTHER -> b61 + (b61 - 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00041 failed.
    Attempted to compare integer 2 with non-integer:
    {}
---*)
