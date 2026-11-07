(*---
description: "The standard FiniteSets that TLC pulls in instances Sequences by name, so a replacing file without Len makes it fail."
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
includes: [Sequences.tla]
outcome: parse-error
---*)
---- MODULE standard_tlc_breaks_on_file_sequences ----
EXTENDS TLC, Sequences
Test == Own = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 19, col 48 to line 19, col 50 of module FiniteSets
    | Unknown operator: `Len'.
    | Semantic errors:
    | *** Errors: 4
    | line 19, col 48 to line 19, col 50 of module FiniteSets
    | Unknown operator: `Len'.
    | line 89, col 48 to line 89, col 50 of module TLC
    | Unknown operator: `Len'.
    | line 90, col 34 to line 90, col 36 of module TLC
    | Unknown operator: `Len'.
    | line 92, col 19 to line 92, col 21 of module TLC
    | Unknown operator: `Len'.
    | Semantic errors:
    | *** Errors: 4
    | line 19, col 48 to line 19, col 50 of module FiniteSets
    | Unknown operator: `Len'.
    | line 89, col 48 to line 89, col 50 of module TLC
    | Unknown operator: `Len'.
    | line 90, col 34 to line 90, col 36 of module TLC
    | Unknown operator: `Len'.
    | line 92, col 19 to line 92, col 21 of module TLC
    | Unknown operator: `Len'.
    3002:1 Parsing or semantic analysis failed.
---*)
