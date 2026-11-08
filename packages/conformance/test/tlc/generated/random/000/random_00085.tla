(*---
description: Evaluates a random seq expression, seed 262, number 85.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00085 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SubSeq((<<3, 1, 2>> \o <<1>>), (CHOOSE b131 \in {1} : TRUE), (-1 * 2147483647)) \o Tail(Append(<<3, 1, 2>>, 7))), CASE ((2 = 2) => (\A b132 \in {x \in 1..3 : x > 1} : TRUE)) -> Len(Tail(<<>>)) [] OTHER -> (([a |-> 1]).a + {0, 0}), Len(SelectSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00085 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
