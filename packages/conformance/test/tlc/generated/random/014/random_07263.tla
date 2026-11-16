(*---
description: Evaluates a random set expression, seed 262, number 7263.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07263 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b11176 \in ((7 \div 7) .. (3 \div 7)) : ((b11176 < <<3, 1, 2>>) /\ (\E b11177 \in SUBSET {1} : FALSE))} \cup (([[a |-> 1] EXCEPT !.a = @ + 7]).a .. Len(<<[x \in Nat |-> x + 1], 1>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
