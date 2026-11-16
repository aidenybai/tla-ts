(*---
description: Evaluates a random bool expression, seed 262, number 7832.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07832 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (TRUE \/ TRUE) THEN (-1 * 2) ELSE (7 * 7) = (CASE 7 -> 1 [] OTHER -> -1 + (-2))) <=> (((~TRUE) \subseteq ({} \cup 2..1)) \/ (LET b12099 == 7 IN 1 < (3 \div 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07832 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 108 to line 14, col 139 of module random_07832
---*)
