(*---
description: Evaluates a random set expression, seed 262, number 3303.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03303 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(SubSeq(Tail(<<>>), LET b5252 == -1 IN b5252, CASE TRUE -> 3 [] OTHER -> 2147483647)), (CHOOSE b5253 \in UNION {(1..3 \cap {1}), {b5254 \in SUBSET {1} : FALSE}} : (\A b5255 \in UNION {SUBSET {1}, {1}} : (TRUE /\ FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
