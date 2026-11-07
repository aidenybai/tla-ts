(*---
description: Evaluates a random bool expression, seed 262, number 7286.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07286 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b11220 == (7 \div 3) IN (3 * b11220) < Cardinality(UNION {{}, {1}})) => SubSeq(<<(1 - 7), Head(<<1>>)>>, ([(1 :> 2) EXCEPT ![0] = 7])[LET b11221 == 2147483647 IN -1], Head((<<1, 2>> \o <<1>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
