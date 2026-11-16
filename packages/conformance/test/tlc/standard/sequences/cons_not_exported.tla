(*---
description: Sequences.java has a Cons method but Sequences.tla no Cons, so a spec cannot call it.
ref: tlc2/module/Sequences.java#Cons
features:
  - Sequences
flags:
  - expression
contexts:
  - assume
outcome: parse-error
---*)
---- MODULE cons_not_exported ----
EXTENDS Sequences, Naturals
Test == Cons(1, <<>>) = <<1>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 9 to line 14, col 12 of module cons_not_exported
    | Unknown operator: `Cons'.
    3002:1 Parsing or semantic analysis failed.
---*)
