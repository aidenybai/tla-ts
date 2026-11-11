(*---
description: \A over Nat gives the Nat-specific non-enumerable message.
ref: tlc2/module/Naturals.java#getNonEnumerableErrorMsg
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE nat_forall_not_enumerable ----
EXTENDS Naturals
Test == \A n \in Nat : n >= 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module nat_forall_not_enumerable failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 12, col 18 to line 12, col 20 of module nat_forall_not_enumerable
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
init:
  exit: 75
  transcript: |-
    1000:1 TLC encountered the non-enumerable quantifier bound
    Nat
    line 12, col 18 to line 12, col 20 of module nat_forall_not_enumerable
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_forall_not_enumerable
    1. Line 14, column 29 to line 14, column 32 in nat_forall_not_enumerable
    2. Line 12, column 9 to line 12, column 29 in nat_forall_not_enumerable
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : TLC encountered the non-enumerable quantifier bound
    Nat
    line 12, col 18 to line 12, col 20 of module nat_forall_not_enumerable
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in nat_forall_not_enumerable
    1. Line 15, column 30 to line 15, column 33 in nat_forall_not_enumerable
    2. Line 12, column 9 to line 12, column 29 in nat_forall_not_enumerable
invariant:
  exit: 75
  transcript: |-
    2102:1 TLC encountered the non-enumerable quantifier bound
    Nat
    line 12, col 18 to line 12, col 20 of module nat_forall_not_enumerable
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_forall_not_enumerable
    1. Line 16, column 8 to line 16, column 32 in nat_forall_not_enumerable
    2. Line 16, column 29 to line 16, column 32 in nat_forall_not_enumerable
    3. Line 12, column 9 to line 12, column 29 in nat_forall_not_enumerable
property:
  exit: 75
  transcript: |-
    2102:1 TLC encountered the non-enumerable quantifier bound
    Nat
    line 12, col 18 to line 12, col 20 of module nat_forall_not_enumerable
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_forall_not_enumerable
    1. Line 15, column 12 to line 15, column 36 in nat_forall_not_enumerable
    2. Line 15, column 33 to line 15, column 36 in nat_forall_not_enumerable
    3. Line 12, column 9 to line 12, column 29 in nat_forall_not_enumerable
---*)
