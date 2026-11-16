(*---
description: The replacing Integers.tla has no prefix minus.
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
includes: [Integers.tla]
outcome: parse-error
---*)
---- MODULE prefix_minus_absent ----
EXTENDS Integers
Test == -1 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 9 to line 10, col 9 of module prefix_minus_absent
    | Could not find declaration or definition of symbol '-.'.
    | line 10, col 9 to line 10, col 10 of module prefix_minus_absent
    | Couldn't resolve prefix operator symbol `-.'.
    3002:1 Parsing or semantic analysis failed.
---*)
