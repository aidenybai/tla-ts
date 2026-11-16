(*---
description: Evaluates a random bool expression, seed 262, number 2866.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02866 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(<<Cardinality({}), ([a |-> 1, b |-> TRUE]).a>>, Cardinality({3 : b4538 \in 1..3})) = [b4539 \in (DOMAIN [x \in Nat |-> x + 1] \cap {2, -1}) |-> (CASE TRUE -> 0 [] OTHER -> b4539 + (b4539 + b4539))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
