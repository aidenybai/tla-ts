(*---
description: Evaluates a random seq expression, seed 262, number 9315.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09315 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(SubSeq((7 \div 2), CASE 2 -> 2 [] OTHER -> 7, ({})[-1]), LET b14454 == (7 - 3) IN (b14454 \div b14454), ((~TRUE) % (-1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09315 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. 2
---*)
