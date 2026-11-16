(*---
description: Evaluates a random seq expression, seed 262, number 2211.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02211 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<(CASE TRUE -> 2147483647 [] OTHER -> 1 + (7 + 2147483647)), ((\E b3477 \in Nat : TRUE)).a>> EXCEPT ![1] = IF (<<-1, 3>> = ([a |-> 1] :> 0)) THEN (CHOOSE b3478 \in ({x \in 1..3 : x > 1} \cap SUBSET {1}) : (\E b3479 \in {1, 2} : FALSE)) ELSE Len(<<0, 7>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02211 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 94 to line 14, col 96 of module random_02211
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
