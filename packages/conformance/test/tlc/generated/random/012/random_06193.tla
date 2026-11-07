(*---
description: Evaluates a random int expression, seed 262, number 6193.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06193 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b9539 \in {1, 2} |-> b9539])[Head(<<>>)] - ((-1 * FALSE) % (0 + 0))) \div Len(SubSeq(<<2147483647, 0>>, (CHOOSE b9540 \in FALSE : TRUE), [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
