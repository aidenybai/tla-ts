(*---
description: Evaluates a random bool expression, seed 262, number 3434.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03434 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SelectSeq((<<1, 2>> \o <<3, 1, 2>>), LAMBDA e : e > 0), CASE (3 < 3) -> (2147483647 % -1) [] OTHER -> {b5442 \in {1, 2} : FALSE}) \/ (\E b5443 \in {b5444 \in (0 .. 7) : (TRUE \in {2, 1, 3})} : (~(-1 < 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03434 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a tuple.
    line 14, col 17 to line 14, col 228 of module random_03434
---*)
