(*---
description: Evaluates a random seq expression, seed 262, number 8488.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08488 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<(CHOOSE b13141 \in {3, 3} : (\E b13142 \in SUBSET {1} : TRUE)), LET b13143 == (CHOOSE b13144 \in (1 :> 2) : TRUE) IN Head(<<>>)>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
