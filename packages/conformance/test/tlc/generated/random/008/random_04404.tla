(*---
description: Evaluates a random bool expression, seed 262, number 4404.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04404 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b6929 \in ({(b6930 * b6930) : b6930 \in (2..1 \cup <<3, 1, 2>>)} \cap {(7 * 7) : b6931 \in UNION {{1, 2}, Nat}}) : (((~TRUE) \/ (b6929 = b6929)) => (CASE FALSE -> -1 [] OTHER -> 7 < (CHOOSE b6932 \in {x \in 1..3 : x > 1} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04404 failed.
    TLC encountered a non-enumerable quantifier bound
    <<3, 1, 2>>.
    line 14, col 61 to line 14, col 81 of module random_04404
---*)
