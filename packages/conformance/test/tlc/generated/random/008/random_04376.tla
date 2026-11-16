(*---
description: Evaluates a random seq expression, seed 262, number 4376.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04376 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<IF ({7 : b6894 \in Nat} = (2147483647 :> 1)) THEN ((2147483647 + 2) - ({1} + -1)) ELSE Len(Append(7, 1)), (Len(SubSeq(<<>>, 2, -1)) % IF ({2, 1, 3} = {1, 2}) THEN [[a |-> 1] EXCEPT !.a = @ + -1] ELSE (2147483647 * 0))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04376 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 37 to line 14, col 39 of module random_04376
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
