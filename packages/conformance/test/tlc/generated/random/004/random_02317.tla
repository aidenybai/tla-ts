(*---
description: Evaluates a random set expression, seed 262, number 2317.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02317 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[b3663 \in ({2, 1, 3} \ {1, 2}) |-> ([x \in Nat |-> x + 1])[1]] EXCEPT ![(CHOOSE b3664 \in {2 : b3665 \in Nat} : (TRUE /\ TRUE))] = LET b3666 == LET b3667 == 2 IN 2147483647 IN Head([x \in 1..2 |-> x])] EXCEPT ![(SelectSeq(Append(Nat, 2), LAMBDA e : e > 0) = (CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE))] = CASE ([[x \in Nat |-> x + 1] EXCEPT ![1] = -1] = (7 :> <<1, 2>>)) -> ((3 % [a |-> 1]) * ([a |-> 1]).a) [] OTHER -> ([a |-> 2, b |-> TRUE]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02317 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 124 to line 14, col 126 of module random_02317
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
