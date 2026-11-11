(*---
description: Evaluates a random record expression, seed 262, number 125.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00125 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([b193 \in <<0, 1>> |-> (b193 * b193)])[CASE Len(<<1>>) -> LET b194 == 2147483647 IN b194 [] OTHER -> (CHOOSE b195 \in {} : TRUE)] EXCEPT !.a = @ + (CASE SubSeq(<<>>, 2147483647, 0) -> Len(<<1>>) [] OTHER -> (1 \div 3) % (Head(<<>>) \div (1 * 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00125 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 62 to line 14, col 71 of module random_00125
---*)
