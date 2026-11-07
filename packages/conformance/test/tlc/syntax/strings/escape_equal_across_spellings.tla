(*---
description: "A string with an escaped backslash equals itself, compared after reduction."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE escape_equal_across_spellings ----
EXTENDS Sequences, TLC
Test == "a\\b" = "a\\b"
====

(*--- recorded
all:
  exit: 0
---*)
