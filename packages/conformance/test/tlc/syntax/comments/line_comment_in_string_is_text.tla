(*---
description: "\\* cannot start a comment inside a string: an escaped backslash and a star stay two characters."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE line_comment_in_string_is_text ----
EXTENDS Sequences
Test == Len("\\*") = 2
====

(*--- recorded
all:
  exit: 0
---*)
