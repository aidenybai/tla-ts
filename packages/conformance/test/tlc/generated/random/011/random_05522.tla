(*---
description: Evaluates a random set expression, seed 262, number 5522.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05522 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({LET b8536 == Len(<<1>>) IN (-1), (Head(<<3, 1, 2>>) - ([a |-> 1]).a)} \cup DOMAIN [b8537 \in {b8538 \in {} : TRUE} |-> (b8537 \div 1)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-1, 2}"
---*)
