(*---
description: Evaluates a random bool expression, seed 262, number 6651.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06651 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 % 3) \in UNION {1..3, {}}) = (Head(<<>>) :> (0 + 2147483647))) => (IF (\E b10203 \in SUBSET {1} : TRUE) THEN Cardinality({2, 1, 3}) ELSE ((1 :> 2))[-1] < (((1 :> 2))[2147483647] * Head(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
