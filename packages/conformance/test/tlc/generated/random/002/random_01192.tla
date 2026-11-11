(*---
description: Evaluates a random int expression, seed 262, number 1192.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01192 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b1911 == ((-CASE FALSE -> 0 [] OTHER -> 2) + (IF TRUE THEN 3 ELSE 3 - (-1 + 7))) IN ((Cardinality(2..1) * (-1 + 7)) % (CHOOSE b1912 \in UNION {1..3, <<>>} : (7 \in {}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01192 failed.
    Attempted to compare the function <<>> with the value:
    1..3
---*)
