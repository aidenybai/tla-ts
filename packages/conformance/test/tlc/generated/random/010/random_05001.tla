(*---
description: Evaluates a random record expression, seed 262, number 5001.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05001 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b7779 \in UNION {{0 : b7780 \in Nat}, UNION {{x \in 1..3 : x > 1}, SUBSET {1}}} : (\E b7781 \in (2..1 \cap Nat) : (b7779 = b7781))), b |-> (~(({x \in 1..3 : x > 1} \cap <<5, 6>>) = SelectSeq(<<>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05001 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 63 to line 14, col 65 of module random_05001
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
