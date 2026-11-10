(*---
description: map_over applied to nat, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in Nat})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module map_over_nat failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 27 to line 14, col 29 of module map_over_nat
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
