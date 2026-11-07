(*---
description: Evaluates a random set expression, seed 262, number 1420.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01420 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(IF FALSE THEN 3 ELSE 1 - Len(0)), (-(\A b2265 \in 1..3 : FALSE))} \cup {((CHOOSE b2266 \in SUBSET {1} : FALSE) % (CHOOSE b2267 \in 1..3 : TRUE)), (Len(<<>>) + Head(<<1, 2>>))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    0
    2283:0 The argument of Len should be a sequence, but instead it is:
    0
---*)
