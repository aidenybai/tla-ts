(*---
description: Evaluates a random seq expression, seed 262, number 7984.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07984 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE), ((-3) * Head(<<>>)), ([a |-> 2147483647, b |-> FALSE]).a) EXCEPT ![1] = LET b12332 == IF [b12333 \in {2, 1, 3} |-> 7] THEN (-2147483647) ELSE (2 % 7) IN ((0 + 2) * (0 % [a |-> 1, b |-> TRUE]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
