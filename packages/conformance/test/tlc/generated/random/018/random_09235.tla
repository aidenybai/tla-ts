(*---
description: Evaluates a random set expression, seed 262, number 9235.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09235 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b14330 \in {b14331 \in ((-1 \div 0) .. Head(<<1, 2>>)) : (({1} = {1}) <=> (\E b14332 \in SUBSET {1} : FALSE))} : (((<<3, 1, 2>>).a - Head(<<1, 2>>)) < IF (TRUE /\ FALSE) THEN Head(<<1, 2>>) ELSE (b14330 - b14330))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09235 failed.
    2179:0 The second argument of \div is 0.
---*)
