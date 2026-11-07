(*---
description: Evaluates a random seq expression, seed 262, number 9907.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09907 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(<<[a |-> 7, b |-> TRUE], LET b15408 == 1 IN 7>>, Head(Tail(<<>>))) \o SubSeq(Tail((<<>> \o <<3, 1, 2>>)), LET b15409 == (CHOOSE r \in [a : 2..1] : TRUE) IN (CHOOSE b15410 \in SUBSET {1} : FALSE), (-(TRUE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
