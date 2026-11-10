(*---
description: Evaluates a random int expression, seed 262, number 223.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00223 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (\E b361 \in ({b362 : b362 \in Nat} \cup {b363 \in {1, 2} : TRUE}) : ((1 .. 1) = UNION {{1}, {1}})) -> ((-((1 :> 2))[2]) % (([x \in Nat |-> x + 1] @@ (1 :> 2)))[(0 - 1)]) [] OTHER -> Len(SubSeq(Append(0, 3), CASE <<1>> -> -1 [] OTHER -> 0, LET b364 == <<5, 6>> IN -1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00223 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 52 to line 14, col 54 of module random_00223
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
