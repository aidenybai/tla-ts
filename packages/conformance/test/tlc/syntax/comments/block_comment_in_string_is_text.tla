(*---
description: "(* inside a string does not start a comment."
ref: "tla2sany/parser/TLAplusParser.java#String"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_in_string_is_text ----
EXTENDS Sequences
Test == Len("(*") = 2
====

(*--- recorded
all:
  exit: 0
---*)
