(*---
description: Evaluates a random seq expression, seed 262, number 1348.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01348 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(Cardinality({1}) - (CHOOSE b2147 \in {x \in 1..3 : x > 1} : TRUE)), (CHOOSE b2148 \in {b2149 \in SUBSET {1} : TRUE} : (\E b2150 \in Nat : FALSE))>> \o (SelectSeq(Append(<<>>, 2), LAMBDA e : e > 0) \o <<Len(<<>>), LET b2151 == -1 IN b2151>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01348 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 152 to line 14, col 154 of module random_01348
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
