(*---
description: Evaluates a random set expression, seed 262, number 9425.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09425 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SubSeq([<<1>> EXCEPT ![1] = 1], (CHOOSE b14621 \in {} : FALSE), Head({1}))) : b14620 \in {IF (b14622 < 3) THEN IF TRUE THEN b14622 ELSE 2147483647 ELSE Len(<<>>) : b14622 \in ((1 .. -1) \ ({} \cup {1, 2}))}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
