(*---
description: TLCEvalDefinition evaluates the definition's TLA+ body, skipping Java overrides, so Nat is the { } written in Naturals.tla. Real TLC bug, as Nat is the set of natural numbers.
ref: tlc2/module/TLCExt.java#tlcDefByName
features:
  - TLCExt
  - tlc-bug
flags:
  - expression
outcome: success
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 74, col 8 to line 74, col 11 of module eval_def_extended_skips_override failed.
      Attempted to compare overridden value Nat with non-overridden value:
      {}
  init:
    exit: 75
    transcript: |-
      1000:1 Attempted to compare overridden value Nat with non-overridden value:
      {}
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 75, column 9 to line 75, column 32 in eval_def_extended_skips_override
      1. Line 75, column 29 to line 75, column 32 in eval_def_extended_skips_override
      2. Line 73, column 9 to line 73, column 37 in eval_def_extended_skips_override
  invariant:
    exit: 75
    transcript: |-
      2102:1 Attempted to compare overridden value Nat with non-overridden value:
      {}
      While working on the initial state:
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 75, column 9 to line 75, column 32 in eval_def_extended_skips_override
      1. Line 77, column 8 to line 77, column 32 in eval_def_extended_skips_override
      2. Line 77, column 29 to line 77, column 32 in eval_def_extended_skips_override
      3. Line 73, column 9 to line 73, column 37 in eval_def_extended_skips_override
  next:
    exit: 75
    transcript: |-
      1000:1 TLC threw an unexpected exception.
      This was probably caused by an error in the spec or model.
      See the User Output or TLC Console for clues to what happened.
      The exception was a java.lang.RuntimeException
      : Attempted to compare overridden value Nat with non-overridden value:
      {}
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 76, column 9 to line 76, column 33 in eval_def_extended_skips_override
      1. Line 76, column 30 to line 76, column 33 in eval_def_extended_skips_override
      2. Line 73, column 9 to line 73, column 37 in eval_def_extended_skips_override
  property:
    exit: 75
    transcript: |-
      2102:1 Attempted to compare overridden value Nat with non-overridden value:
      {}
      While working on the initial state:
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 75, column 9 to line 75, column 32 in eval_def_extended_skips_override
      1. Line 76, column 12 to line 76, column 36 in eval_def_extended_skips_override
      2. Line 76, column 33 to line 76, column 36 in eval_def_extended_skips_override
      3. Line 73, column 9 to line 73, column 37 in eval_def_extended_skips_override
---*)
---- MODULE eval_def_extended_skips_override ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCEvalDefinition("Nat") = {}
====

(*--- recorded
all:
  exit: 0
---*)
