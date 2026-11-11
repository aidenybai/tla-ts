(*---
description: Evaluates a random set expression, seed 262, number 9165.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09165 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b14233 \in {SelectSeq(<<>>, LAMBDA e : e > 0), (0 - 3)} |-> (Len(<<3, 1, 2>>) % Head(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09165 failed.
    Attempted to compare integer -3 with non-integer:
    <<>>
---*)
