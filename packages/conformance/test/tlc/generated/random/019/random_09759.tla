(*---
description: Evaluates a random set expression, seed 262, number 9759.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09759 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SelectSeq(<<>>, LAMBDA e : e > 0)) .. Head(SubSeq(<<>>, 2, -1))) \cap (({3, 2147483647} \cup DOMAIN <<5, 6>>) \cup {LET b15150 == 3 IN 3 : b15149 \in UNION {Nat, {2, 1, 3}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
