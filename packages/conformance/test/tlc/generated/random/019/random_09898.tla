(*---
description: Evaluates a random int expression, seed 262, number 9898.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09898 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (~(Len(<<1, 2>>) < (1 % 7))) -> (-Head(<<7, 2>>)) [] OTHER -> (IF ({1, 2} = Nat) THEN (-3) ELSE (0 + 3) \div (CASE TRUE -> -1 [] OTHER -> -1 - LET b15391 == -1 IN -1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -7"
---*)
