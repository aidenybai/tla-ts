(*---
description: "\"(*\" and \"*)\" are ordinary text, including an unmatched close."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE adjacent_comment_chars ----
EXTENDS Sequences, TLC
Test == Len("*)") = 2
====

(*--- recorded
all:
  exit: 0
---*)
