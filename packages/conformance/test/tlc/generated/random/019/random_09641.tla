(*---
description: Evaluates a random set expression, seed 262, number 9641.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09641 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b14968 \in {LET b14969 == [a |-> 7, b |-> (1 :> 2)] IN Len([a |-> 1, b |-> TRUE]), (-CASE FALSE -> 3 [] OTHER -> 2)} : (\E b14970 \in {(b14971 + b14968) : b14971 \in (b14968 .. 1)} : (\A b14972 \in ({1, 2} \cup {}) : (b14970 < 0)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
