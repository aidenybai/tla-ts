(*---
description: \E over Seq({}) is rejected too, though it has just one element.
ref: tlc2/module/Sequences.java#getNonEnumerableErrorMsg
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE seq_exists_empty_range_not_enumerable ----
EXTENDS Sequences, Naturals
Test == \E s \in Seq({}) : TRUE
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module seq_exists_empty_range_not_enumerable failed.
    TLC encountered the non-enumerable quantifier bound
    Seq({})
    line 12, col 18 to line 12, col 24 of module seq_exists_empty_range_not_enumerable
    In TLA+, Seq(S) represents the set of all finite sequences whose elements come from the set S. Even when S
    is a finite set, the number of possible sequences in Seq(S) is unbounded because sequences can have any
    finite length (e.g., length 0, 1, 2, and so on). As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Seq({}), because this would require checking an
    infinite number of cases. Note that for a finite set of sequences s, TLC handles s \subseteq Seq(S).
    See https://explain.tlapl.us/seq-unenumerable for additional details.
init:
  exit: 75
  transcript: |-
    1000:1 TLC encountered the non-enumerable quantifier bound
    Seq({})
    line 12, col 18 to line 12, col 24 of module seq_exists_empty_range_not_enumerable
    In TLA+, Seq(S) represents the set of all finite sequences whose elements come from the set S. Even when S
    is a finite set, the number of possible sequences in Seq(S) is unbounded because sequences can have any
    finite length (e.g., length 0, 1, 2, and so on). As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Seq({}), because this would require checking an
    infinite number of cases. Note that for a finite set of sequences s, TLC handles s \subseteq Seq(S).
    See https://explain.tlapl.us/seq-unenumerable for additional details.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_exists_empty_range_not_enumerable
    1. Line 14, column 29 to line 14, column 32 in seq_exists_empty_range_not_enumerable
    2. Line 12, column 9 to line 12, column 31 in seq_exists_empty_range_not_enumerable
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : TLC encountered the non-enumerable quantifier bound
    Seq({})
    line 12, col 18 to line 12, col 24 of module seq_exists_empty_range_not_enumerable
    In TLA+, Seq(S) represents the set of all finite sequences whose elements come from the set S. Even when S
    is a finite set, the number of possible sequences in Seq(S) is unbounded because sequences can have any
    finite length (e.g., length 0, 1, 2, and so on). As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Seq({}), because this would require checking an
    infinite number of cases. Note that for a finite set of sequences s, TLC handles s \subseteq Seq(S).
    See https://explain.tlapl.us/seq-unenumerable for additional details.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in seq_exists_empty_range_not_enumerable
    1. Line 15, column 30 to line 15, column 33 in seq_exists_empty_range_not_enumerable
    2. Line 12, column 9 to line 12, column 31 in seq_exists_empty_range_not_enumerable
invariant:
  exit: 75
  transcript: |-
    2102:1 TLC encountered the non-enumerable quantifier bound
    Seq({})
    line 12, col 18 to line 12, col 24 of module seq_exists_empty_range_not_enumerable
    In TLA+, Seq(S) represents the set of all finite sequences whose elements come from the set S. Even when S
    is a finite set, the number of possible sequences in Seq(S) is unbounded because sequences can have any
    finite length (e.g., length 0, 1, 2, and so on). As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Seq({}), because this would require checking an
    infinite number of cases. Note that for a finite set of sequences s, TLC handles s \subseteq Seq(S).
    See https://explain.tlapl.us/seq-unenumerable for additional details.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_exists_empty_range_not_enumerable
    1. Line 16, column 8 to line 16, column 32 in seq_exists_empty_range_not_enumerable
    2. Line 16, column 29 to line 16, column 32 in seq_exists_empty_range_not_enumerable
    3. Line 12, column 9 to line 12, column 31 in seq_exists_empty_range_not_enumerable
property:
  exit: 75
  transcript: |-
    2102:1 TLC encountered the non-enumerable quantifier bound
    Seq({})
    line 12, col 18 to line 12, col 24 of module seq_exists_empty_range_not_enumerable
    In TLA+, Seq(S) represents the set of all finite sequences whose elements come from the set S. Even when S
    is a finite set, the number of possible sequences in Seq(S) is unbounded because sequences can have any
    finite length (e.g., length 0, 1, 2, and so on). As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Seq({}), because this would require checking an
    infinite number of cases. Note that for a finite set of sequences s, TLC handles s \subseteq Seq(S).
    See https://explain.tlapl.us/seq-unenumerable for additional details.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in seq_exists_empty_range_not_enumerable
    1. Line 15, column 12 to line 15, column 36 in seq_exists_empty_range_not_enumerable
    2. Line 15, column 33 to line 15, column 36 in seq_exists_empty_range_not_enumerable
    3. Line 12, column 9 to line 12, column 31 in seq_exists_empty_range_not_enumerable
---*)
