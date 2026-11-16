(*---
description: Evaluates a random bool expression, seed 262, number 183.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00183 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~(\E b292 \in Nat : TRUE)) <=> (CASE FALSE -> 1 [] OTHER -> 2147483647 \in SortSeq(<<>>, LAMBDA p, q : p < q))) /\ ({([a |-> 1, b |-> TRUE]).a : b293 \in DOMAIN [x \in 1..2 |-> x]} \subseteq {b294 \in {3, 2} : (TRUE = [a |-> 1])})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00183 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 33 to line 14, col 35 of module random_00183
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
