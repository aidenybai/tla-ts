(*---
description: Evaluates a random record expression, seed 262, number 7231.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07231 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len([<<-1, 3>> EXCEPT ![1] = (1 * 2147483647)]), b |-> ({LET b11109 == 7 IN b11109, Len(<<1>>)} \subseteq (CASE FALSE -> 2147483647 [] OTHER -> 0 .. IF TRUE THEN 2147483647 ELSE 2147483647))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2, b |-> TRUE]"
---*)
