(*---
description: Evaluates a random set expression, seed 262, number 3323.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03323 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({SortSeq(<<>>, LAMBDA p, q : p < q) : b5283 \in ({1} \cap {})} \cap (IF FALSE THEN 2147483647 ELSE 0 .. IF TRUE THEN -1 ELSE 1)) \cup DOMAIN (CASE FALSE -> <<1, 2>> [] OTHER -> 1 :> (2147483647 % 3))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
