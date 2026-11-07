(*---
description: Evaluates a random record expression, seed 262, number 5614.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05614 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Len(<<1>>) \div CASE FALSE -> 1 [] OTHER -> 2) \div (Tail(<<>>) % SelectSeq(<<>>, LAMBDA e : e > 0))), b |-> (\A b8687 \in ((<<5, 6>>)[2] .. (7 + 2147483647)) : ((3 .. 2) \subseteq {b8687 : b8688 \in Nat}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
