(*---
description: Evaluates a random seq expression, seed 262, number 1143.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01143 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<(CHOOSE b1832 \in {[x \in 1..2 |-> x], 2} : (TRUE => FALSE)), (Head(<<1, 2>>) \div LET b1833 == 2147483647 IN b1833)>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01143 failed.
    Attempted to compare integer 2 with non-integer:
    <<1, 2>>
---*)
