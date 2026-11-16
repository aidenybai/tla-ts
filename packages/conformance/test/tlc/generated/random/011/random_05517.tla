(*---
description: Evaluates a random seq expression, seed 262, number 5517.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05517 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(([<<1, 2>> EXCEPT ![1] = 0] \o SelectSeq(<<1, 2>>, LAMBDA e : e > 0))), (IF (TRUE => TRUE) THEN (3 * 3) ELSE (CHOOSE b8528 \in {} : TRUE) + CASE (FALSE \/ TRUE) -> (1 \div 1) [] OTHER -> (3 * 1)), ([[b8529 \in {1} |-> 3] EXCEPT ![(1 * 0)] = SortSeq(<<1>>, LAMBDA p, q : p < q)])[((0 - -1) + Cardinality(2..1))]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 227 to line 14, col 247 of module random_05517
    | <<>>
---*)
