(*---
description: "A set map over Nat reports the non-enumerable bound message."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE non_enumerable_bound ----
EXTENDS Integers
Test == {x : x \in Nat} # {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module non_enumerable_bound failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 9, col 20 to line 9, col 22 of module non_enumerable_bound
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
init:
  exit: 75
  transcript: |-
    1000:1 TLC encountered the non-enumerable quantifier bound
    Nat
    line 9, col 20 to line 9, col 22 of module non_enumerable_bound
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_enumerable_bound
    1. Line 11, column 29 to line 11, column 32 in non_enumerable_bound
    2. Line 9, column 9 to line 9, column 28 in non_enumerable_bound
    3. Line 9, column 9 to line 9, column 23 in non_enumerable_bound
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : TLC encountered the non-enumerable quantifier bound
    Nat
    line 9, col 20 to line 9, col 22 of module non_enumerable_bound
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in non_enumerable_bound
    1. Line 12, column 30 to line 12, column 33 in non_enumerable_bound
    2. Line 9, column 9 to line 9, column 28 in non_enumerable_bound
    3. Line 9, column 9 to line 9, column 23 in non_enumerable_bound
invariant:
  exit: 75
  transcript: |-
    2102:1 TLC encountered the non-enumerable quantifier bound
    Nat
    line 9, col 20 to line 9, col 22 of module non_enumerable_bound
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_enumerable_bound
    1. Line 13, column 8 to line 13, column 32 in non_enumerable_bound
    2. Line 13, column 29 to line 13, column 32 in non_enumerable_bound
    3. Line 9, column 9 to line 9, column 28 in non_enumerable_bound
    4. Line 9, column 9 to line 9, column 23 in non_enumerable_bound
property:
  exit: 75
  transcript: |-
    2102:1 TLC encountered the non-enumerable quantifier bound
    Nat
    line 9, col 20 to line 9, col 22 of module non_enumerable_bound
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_enumerable_bound
    1. Line 12, column 12 to line 12, column 36 in non_enumerable_bound
    2. Line 12, column 33 to line 12, column 36 in non_enumerable_bound
    3. Line 9, column 9 to line 9, column 28 in non_enumerable_bound
    4. Line 9, column 9 to line 9, column 23 in non_enumerable_bound
---*)
