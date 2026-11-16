(*---
description: Sequences.java has a SelectInSeq method but Sequences.tla no such definition.
ref: tlc2/module/Sequences.java#SelectInSeq
features:
  - Sequences
flags:
  - expression
contexts:
  - assume
outcome: parse-error
---*)
---- MODULE select_in_seq_not_exported ----
EXTENDS Sequences, Naturals
Test == SelectInSeq(<<>>, 1) = 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 9 to line 14, col 19 of module select_in_seq_not_exported
    | Unknown operator: `SelectInSeq'.
    3002:1 Parsing or semantic analysis failed.
---*)
