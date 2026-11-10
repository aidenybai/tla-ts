(*---
description: Evaluates a random int expression, seed 262, number 9982.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09982 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b15520 \in ((Cardinality(1..3) + IF FALSE THEN -1 ELSE 1) .. IF (TRUE => TRUE) THEN CASE FALSE -> 0 [] OTHER -> 7 ELSE (CHOOSE b15521 \in Nat : FALSE)) : ((({x \in 1..3 : x > 1}).a % Cardinality(2..1)) = Append(Append(<<3, 1, 2>>, b15520), (2..1 = {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09982 failed.
    Attempted to select field "a" from a non-record value {2, 3}
    line 14, col 180 to line 14, col 203 of module random_09982
---*)
