(*---
description: Evaluates a random int expression, seed 262, number 2090.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02090 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-IF (<<0, 1>> = [b3331 \in Nat |-> b3331]) THEN ((CHOOSE b3332 \in {2, 1, 3} : TRUE) * IF 3 THEN <<1, 2>> ELSE 1) ELSE CASE (TRUE => FALSE) -> (7 \div 1) [] OTHER -> Head(<<3, 1, 2>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02090 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
