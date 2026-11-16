(*---
description: Evaluates a random bool expression, seed 262, number 6795.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06795 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b10425 \in {Head(Append(<<>>, 2147483647)), LET b10426 == (CHOOSE b10427 \in {1} : TRUE) IN (0 % b10426)} : (SubSeq((<<>> \o <<1>>), (b10425 % 2), (-1 - b10425)) = {(CHOOSE b10428 \in {2, 1, 3} : TRUE), Len(<<1, 2>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06795 failed.
    Attempted to check equality of the function <<>> with the value:
    {1, 2}
---*)
