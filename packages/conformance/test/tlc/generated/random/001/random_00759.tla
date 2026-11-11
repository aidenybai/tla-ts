(*---
description: Evaluates a random function expression, seed 262, number 759.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00759 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1243 \in {b1244 \in DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![0] = 2] : (Len(<<3, 1, 2>>) \in UNION {Nat, {1}})} |-> Len([({} \o <<3, 1, 2>>) EXCEPT ![1] = SubSeq(<<>>, b1243, b1243)])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b1243 \\in {b1244 \\in Nat : <expression line 14, col 88 to line 14, col 124 of module random_00759> } |-> <expression line 14, col 132 to line 14, col 198 of module random_00759>]"
---*)
