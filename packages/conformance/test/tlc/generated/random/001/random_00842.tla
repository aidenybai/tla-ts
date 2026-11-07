(*---
description: Evaluates a random function expression, seed 262, number 842.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00842 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1372 \in {b1373 \in ((-1 .. 0) \ (1 .. 2)) : (\A b1374 \in {b1373 : b1375 \in {1}} : (TRUE = [a |-> 1, b |-> TRUE]))} |-> LET b1376 == ((-1) .. (-b1372)) IN (CHOOSE b1377 \in UNION {Nat, {1}} : (1 = b1372))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00842 failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    [a |-> 1, b |-> TRUE]
---*)
