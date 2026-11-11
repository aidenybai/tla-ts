(*---
description: Evaluates a random record expression, seed 262, number 4297.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04297 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality(DOMAIN [b6772 \in {x \in 1..3 : x > 1} |-> b6772]), b |-> (({b6773 \in Nat : TRUE} \subseteq {3 : b6774 \in Nat}) => ((SUBSET {1} \ {1, 2}) = {2147483647 : b6775 \in {2, 1, 3}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04297 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 143 to line 14, col 145 of module random_04297
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
