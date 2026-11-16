(*---
description: Evaluates a random bool expression, seed 262, number 3104.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03104 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b4955 \in {b4956 \in (3 .. 1) : (b4956 + 3)} |-> ([a |-> b4955, b |-> TRUE]).a] = (Len((<<>> \o <<1>>)) + Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03104 failed.
    Attempted to check equality of the function <<>> with the value:
    2
---*)
