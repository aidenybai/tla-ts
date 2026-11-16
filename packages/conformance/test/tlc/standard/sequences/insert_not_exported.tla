(*---
description: Sequences.java has an Insert method but Sequences.tla no Insert.
ref: tlc2/module/Sequences.java#Insert
features:
  - Sequences
flags:
  - expression
contexts:
  - assume
outcome: parse-error
---*)
---- MODULE insert_not_exported ----
EXTENDS Sequences, Naturals
Test == Insert(<<>>, 1, LAMBDA a, b : TRUE) = <<1>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 9 to line 14, col 14 of module insert_not_exported
    | Unknown operator: `Insert'.
    3002:1 Parsing or semantic analysis failed.
---*)
