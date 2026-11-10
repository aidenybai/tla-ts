(*---
description: Evaluates a random bool expression, seed 262, number 494.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00494 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ({1 : b816 \in Nat} = [b817 \in Nat |-> 2]) THEN IF ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) THEN Head(<<3, 1, 2>>) ELSE LET b818 == -1 IN 1 ELSE ((CHOOSE b819 \in SUBSET {1} : TRUE) \div (<<1>>).a) \in ({b820 \in (2 .. 3) : ({x \in 1..3 : x > 1} \subseteq {1, 2})} \cup {Head(<<>>) : b821 \in {0, -1}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00494 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 35 to line 14, col 37 of module random_00494
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
