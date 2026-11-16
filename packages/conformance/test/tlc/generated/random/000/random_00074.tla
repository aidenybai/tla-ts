(*---
description: Evaluates a random int expression, seed 262, number 74.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00074 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (LET b108 == (Nat).a IN (b108 \div b108) \in {(-2147483647) : b109 \in (<<>> \ SUBSET {1})}) THEN ((CHOOSE b110 \in DOMAIN <<5, 6>> : ([a |-> 1, b |-> TRUE] = [a |-> 1])) \div CASE ({1, 2} \subseteq {1, 2}) -> (-1 % -1) [] OTHER -> (7 \div 1)) ELSE (([[a |-> 1, b |-> TRUE] EXCEPT !.a = <<>>]).a * ((-[a |-> 1]) * Len(<<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00074 failed.
    Attempted to select field "a" from a non-record value Nat
    line 14, col 32 to line 14, col 38 of module random_00074
---*)
