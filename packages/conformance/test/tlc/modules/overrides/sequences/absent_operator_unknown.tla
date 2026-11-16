(*---
description: "Tail is not in the replacing file, so it does not exist."
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
includes: [Sequences.tla]
outcome: parse-error
---*)
---- MODULE absent_operator_unknown ----
EXTENDS Sequences
Test == Tail(<<1>>) = <<>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 9 to line 10, col 12 of module absent_operator_unknown
    | Unknown operator: `Tail'.
    3002:1 Parsing or semantic analysis failed.
---*)
