(*---
description: Evaluates a random set expression, seed 262, number 4224.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04224 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b6640 == (((0 % 2147483647) \div (<<5, 6>>)[1]) * CASE (<<1, 2>> = <<5, 6>>) -> (3 - 7) [] OTHER -> Head(<<1, 2>>)) IN (-([[x \in Nat |-> x + 1] EXCEPT ![b6640] = b6640])[(b6640 - b6640)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
