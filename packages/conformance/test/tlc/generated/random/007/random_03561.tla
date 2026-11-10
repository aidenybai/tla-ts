(*---
description: Evaluates a random function expression, seed 262, number 3561.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03561 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5628 \in (DOMAIN (7 % 1) \cap ((1 .. 3) \cup (0 .. 2147483647))) |-> IF ((~TRUE) <=> (<<1, 2>> = <<3, 1, 2>>)) THEN LET b5629 == (7 - b5628) IN (-0) ELSE Cardinality(({x \in 1..3 : x > 1} \cap 2..1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03561 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 28 to line 14, col 41 of module random_03561
---*)
