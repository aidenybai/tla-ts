(*---
description: Evaluates a random set expression, seed 262, number 3798.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03798 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b5991 \in ({b5992 : b5992 \in 1..3} \ {b5993 \in {1, 2} : TRUE}) : ((<<3, 1, 2>> = <<3, 1, 2>>) => (TRUE /\ TRUE))} \cap ({b5994 \in ({1, 2} \cap <<1>>) : (b5994 < b5994)} \cup (Len(<<>>) .. (2147483647 - 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03798 failed.
    Attempted to check set membership in a tuple value.
---*)
