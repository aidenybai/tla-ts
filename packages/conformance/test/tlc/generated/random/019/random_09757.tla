(*---
description: Evaluates a random bool expression, seed 262, number 9757.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09757 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SubSeq(<<>>, 7, 2) \o (<<1>> \o <<3, 1, 2>>)) = [[[a |-> 1] EXCEPT !.a = @ + 1] EXCEPT !.a = Head(<<1>>)]) <=> (\A b15147 \in ((2147483647 * 2147483647) .. IF TRUE THEN 2147483647 ELSE 1) : (CASE TRUE -> 2147483647 [] OTHER -> b15147 \in {b15147, b15147}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*2147483647
    2178:0 Overflow when computing 2147483647*2147483647
---*)
