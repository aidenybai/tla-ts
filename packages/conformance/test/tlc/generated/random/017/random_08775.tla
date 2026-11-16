(*---
description: Evaluates a random seq expression, seed 262, number 8775.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08775 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(Tail((<<1, 2>> \o <<1>>)), LAMBDA e : e > 0), Cardinality(((<<1>> \cap 1..3) \ ({1, 2} \cup Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08775 failed.
    Attempted to check set membership in a tuple value.
---*)
