(*---
description: Evaluates a random record expression, seed 262, number 2781.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02781 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Head(SubSeq(<<>>, 3, -1)) - CASE (\A b4392 \in 1..3 : Nat) -> Head(<<3, 1, 2>>) [] OTHER -> (<<5, 6>> - -1)), b |-> ((~(\A b4393 \in Nat : FALSE)) <=> ((\E b4394 \in SUBSET {1} : TRUE) <=> (1 = 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
