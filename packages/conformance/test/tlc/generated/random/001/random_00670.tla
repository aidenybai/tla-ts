(*---
description: Evaluates a random seq expression, seed 262, number 670.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00670 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE), (Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) * ((1 - 2147483647) \div ([a |-> 1, b |-> TRUE]).a)), LET b1114 == (CASE FALSE -> -1 [] OTHER -> 1 - (CHOOSE b1115 \in 2..1 : TRUE)) IN IF (3 < b1114) THEN (b1114 % {x \in 1..3 : x > 1}) ELSE Head(<<3, 1, 2>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00670 failed.
    2178:0 Overflow when computing 2*-2147483646
---*)
