(*---
description: Evaluates a random seq expression, seed 262, number 3222.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03222 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail([Append(<<3, 1, 2>>, 0) EXCEPT ![1] = Head(<<1>>)]), ([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = CASE TRUE -> 2147483647 [] OTHER -> -1]).a, (IF (\E b5114 \in Nat : FALSE) THEN LET b5115 == 0 IN 1 ELSE (CHOOSE b5116 \in 3 : FALSE) % ([<<5, 6>> EXCEPT ![-1] = 7])[(CHOOSE b5117 \in {1} : FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03222 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 191 to line 14, col 193 of module random_03222
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
