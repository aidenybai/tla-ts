(*---
description: Evaluates a random function expression, seed 262, number 9905.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09905 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b15401 \in (UNION {(1 \cap 2..1), {b15402 : b15402 \in {}}} \cup ({b15403 \in {} : TRUE} \ ({2, 1, 3} \cap 1..3))) |-> ([(TRUE /\ FALSE) EXCEPT ![[b15404 \in Nat |-> b15401]] = Len(<<1, 2>>)])[(LET b15405 == {1, 2} IN 7 + (7 + 0))]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
