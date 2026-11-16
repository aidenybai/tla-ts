(*---
description: Evaluates a random set expression, seed 262, number 306.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00306 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({LET b507 == ([a |-> 1]).a IN (3 = b507) : b506 \in {b508 \in {b509 \in {1, 2} : TRUE} : (\E b510 \in Nat : TRUE)}} \cup UNION {(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) = [b511 \in 2..1 |-> b511]), {b512 \in {2147483647, 2} : (<<>> = (1 :> 2))}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00306 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 119 to line 14, col 121 of module random_00306
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
