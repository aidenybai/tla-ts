(*---
description: Evaluates a random seq expression, seed 262, number 8178.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08178 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> CASE (~FALSE) -> CASE TRUE -> 0 [] OTHER -> 1 [] OTHER -> (CHOOSE b12649 \in SUBSET {1} : FALSE), b |-> ((\E b12650 \in Nat : TRUE) <=> (Nat \/ TRUE))] \o Tail(Append(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08178 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 144 to line 14, col 146 of module random_08178
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
