(*---
description: Evaluates a random seq expression, seed 262, number 8549.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08549 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SelectSeq((<<1>> \o <<1>>), LAMBDA e : e > 0)), ((Head(<<>>) \div ({1, 2} \cap {x \in 1..3 : x > 1})) + Len(Append(<<1, 2>>, 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
