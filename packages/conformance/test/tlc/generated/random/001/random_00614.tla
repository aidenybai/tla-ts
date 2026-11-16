(*---
description: Evaluates a random set expression, seed 262, number 614.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00614 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({LET b1030 == (b1029 % b1029) IN CASE TRUE -> 0 [] OTHER -> 7 : b1029 \in {(-b1031) : b1031 \in ({} \ {1})}} \cap (SubSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), ({x \in 1..3 : x > 1}).a, Len(<<1>>)) \ {IF TRUE THEN b1032 ELSE b1032 : b1032 \in (2147483647 .. 3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00614 failed.
    Attempted to select field "a" from a non-record value {2, 3}
    line 14, col 175 to line 14, col 198 of module random_00614
---*)
