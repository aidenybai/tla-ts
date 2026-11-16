(*---
description: Evaluates a random record expression, seed 262, number 5684.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05684 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b8756 \in (UNION {[x \in Nat |-> x + 1], {x \in 1..3 : x > 1}} \cap {7 : b8757 \in Nat}) : (~(<<1, 2>> = <<5, 6>>))), b |-> (Head(SubSeq(<<3, 1, 2>>, 2147483647, 0)) = (({} \cap 2..1) \cap {-1, 2}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05684 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 114 to line 14, col 116 of module random_05684
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
