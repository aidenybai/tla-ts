(*---
description: Evaluates a random set expression, seed 262, number 2006.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02006 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) - ([b3177 \in {1} |-> 3]).a), Head(LET b3178 == (CHOOSE b3179 \in 1..3 : FALSE) IN Head(<<1, 2>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02006 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
