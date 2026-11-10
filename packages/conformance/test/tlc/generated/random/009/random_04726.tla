(*---
description: Evaluates a random seq expression, seed 262, number 4726.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04726 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([[<<-1, 2147483647>> EXCEPT ![1] = IF TRUE THEN 1 ELSE 2147483647] EXCEPT ![1] = ({2, FALSE} \ {b7387 \in Nat : FALSE})], Head(SubSeq([<<1, 2>> EXCEPT ![1] = 3], (2147483647 \div 3), CASE FALSE -> 0 [] OTHER -> 7)), CASE ((CHOOSE b7388 \in Nat : FALSE) = (-1)) -> Len(<<7, 3>>) [] OTHER -> LET b7389 == (CHOOSE b7390 \in 2..1 : FALSE) IN (b7389 - b7389)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04726 failed.
    Cannot decide if element:
    FALSE
     is element of:
    Nat
    and satisfies the predicate line 14, col 135 to line 14, col 139 of module random_04726
---*)
